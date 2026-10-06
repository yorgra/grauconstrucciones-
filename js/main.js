(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  onReady(function () {
    initHeader();
    initNav();
    initReveal();
    initActiveLink();
    initGallery();
    initLightbox();
    initForm();
    initYear();
  });

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    var mq = window.matchMedia("(min-width: 901px)");
    var sync = function () {
      if (mq.matches) setOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else if (mq.addListener) mq.addListener(sync);
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (n) {
          return n.classList && n.classList.contains("reveal");
        });
        var index = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(index, 5) * 70 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  function initActiveLink() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__list a[href^='#']"));
    var sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (section) { io.observe(section); });
  }

  function initGallery() {
    var media = Array.prototype.slice.call(document.querySelectorAll(".work__media img"));
    media.forEach(function (img) {
      var markReady = function () {
        img.closest(".work__media").classList.add("has-img");
      };
      if (img.complete && img.naturalWidth > 0) markReady();
      else img.addEventListener("load", markReady);
      img.addEventListener("error", function () {
        img.removeAttribute("src");
      });
    });
  }

  function initLightbox() {
    var box = document.getElementById("lightbox");
    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    if (!box || !triggers.length) return;

    var frame = box.querySelector(".lightbox__frame");
    var label = box.querySelector(".lightbox__label");
    var caption = box.querySelector(".lightbox__caption");
    var closeBtn = box.querySelector(".lightbox__close");
    var lastFocus = null;

    var close = function () {
      box.hidden = true;
      document.body.classList.remove("is-locked");
      frame.querySelectorAll("img").forEach(function (n) { n.remove(); });
      if (lastFocus) lastFocus.focus();
    };

    var open = function (trigger) {
      lastFocus = trigger;
      var src = trigger.getAttribute("data-img");
      var title = trigger.getAttribute("data-lightbox") || "";
      var hasImage = trigger.classList.contains("has-img");

      frame.querySelectorAll("img").forEach(function (n) { n.remove(); });
      label.textContent = hasImage ? "" : "Imagen no disponible";

      if (hasImage && src) {
        var big = document.createElement("img");
        big.src = src;
        big.alt = title;
        frame.appendChild(big);
      }

      caption.textContent = title;
      box.hidden = false;
      document.body.classList.add("is-locked");
      closeBtn.focus();
    };

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () { open(trigger); });
    });

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target === frame) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
  }

  function initForm() {
    var form = document.getElementById("form-presupuesto");
    if (!form) return;

    var status = form.querySelector("[data-status]");
    var endpoint = form.getAttribute("data-form-endpoint");
    var waNumber = form.getAttribute("data-wa");
    var submitBtn = form.querySelector("button[type='submit']");

    var showError = function (name, show) {
      var input = form.elements[name];
      var msg = form.querySelector("[data-error='" + name + "']");
      if (!input) return;
      var field = input.closest(".field");
      if (field) field.classList.toggle("is-invalid", show);
      if (input.setAttribute) input.setAttribute("aria-invalid", String(show));
      if (msg) msg.hidden = !show;
    };

    var validators = {
      nombre: function (v) { return v.trim().length >= 2; },
      telefono: function (v) { return v.replace(/\D/g, "").length >= 9; },
      email: function (v) { return v === "" || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); },
      rgpd: function (v, input) { return input.checked; }
    };

    var validate = function () {
      var firstInvalid = null;
      Object.keys(validators).forEach(function (name) {
        var input = form.elements[name];
        if (!input) return;
        var ok = validators[name](input.value, input);
        showError(name, !ok);
        if (!ok && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    Object.keys(validators).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      var ev = input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "blur";
      input.addEventListener(ev, function () { showError(name, !validators[name](input.value, input)); });
      input.addEventListener("input", function () {
        if (form.querySelector(".field.is-invalid, .is-invalid")) showError(name, !validators[name](input.value, input));
      });
    });

    var setStatus = function (text, kind) {
      if (!status) return;
      status.textContent = text;
      status.classList.remove("is-ok", "is-error");
      if (kind) status.classList.add(kind);
    };

    var buildMessage = function (data) {
      var lines = [
        "Hola, quiero un presupuesto de reformas en Castellón.",
        "",
        "Nombre: " + data.nombre,
        "Teléfono: " + data.telefono
      ];
      if (data.email) lines.push("Correo: " + data.email);
      lines.push("Municipio: " + data.municipio);
      lines.push("Tipo de trabajo: " + data.tipo);
      if (data.mensaje) lines.push("Detalles: " + data.mensaje);
      return lines.join("\n");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("");

      if (!validate()) {
        setStatus("Revisa los campos marcados en rojo.", "is-error");
        return;
      }

      var data = {
        nombre: form.elements.nombre.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        email: form.elements.email ? form.elements.email.value.trim() : "",
        municipio: form.elements.municipio ? form.elements.municipio.value : "",
        tipo: form.elements.tipo ? form.elements.tipo.value : "",
        mensaje: form.elements.mensaje ? form.elements.mensaje.value.trim() : ""
      };

      if (!endpoint) {
        var text = encodeURIComponent(buildMessage(data));
        var url = waNumber
          ? "https://wa.me/" + waNumber + "?text=" + text
          : "mailto:?subject=" + encodeURIComponent("Solicitud de presupuesto") + "&body=" + text;
        window.open(url, waNumber ? "_blank" : "_self");
        setStatus("Abriendo WhatsApp con tus datos…", "is-ok");
        return;
      }

      form.classList.add("is-sending");
      if (submitBtn) submitBtn.disabled = true;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          setStatus("¡Gracias! Hemos recibido tu solicitud. Te llamamos en menos de 24 horas laborables.", "is-ok");
        })
        .catch(function () {
          setStatus("No hemos podido enviar el formulario. Llámanos al 600 123 456 o escríbenos por WhatsApp.", "is-error");
        })
        .finally(function () {
          form.classList.remove("is-sending");
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }
})();
