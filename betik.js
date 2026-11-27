/* töre · Sahne: küçük yardımcılar.
   Sayfa betiksiz de okunur ve gezilir; burada yalnız altı kolaylık var:
   1) ilk sahne geçilince üst şeridin cam zemine dönmesi (ana sayfada üstteki Katıl
      düğmesi de ancak o zaman belirir),
   2) dar ekran menüsünün kendiliğinden kapanması; menü çeviride uzayıp tek satıra
      sığmazsa geniş ekranda da açılır listeye geçilmesi,
   3) "Metni kopyala" düğmesi,
   4) dev sözcüklerin, çeviride uzarsa, tek satıra sığacak kadar küçülmesi
      (yalnız küçültür; sığan sözcüğe dokunmaz),
   5) sahnelerin, ziyaretçi kaydırmaya başladıktan sonra, ekrana girerken bir kez açılması
      (hareket azaltma istenmişse hiç çalışmaz; içerik varsayılan olarak hep görünür),
   6) kenar rayında içinde olunan sahnenin işaretlenmesi.
   Dışarıya istek yok, kayıt yok, çerez yok. */
(function () {
  "use strict";

  var kok = document.documentElement;
  kok.classList.add("js");

  /* 1) Üst şerit */
  var perde = document.querySelector("[data-perde]");
  var ust = document.querySelector(".ust");
  if (perde && ust && "IntersectionObserver" in window) {
    var gozcu = new IntersectionObserver(function (kayitlar) {
      kok.classList.toggle("asagi", !kayitlar[0].isIntersecting);
    }, { rootMargin: "-" + (ust.offsetHeight + 8) + "px 0px 0px 0px" });
    gozcu.observe(perde);
  }

  /* 2) Dar ekran menüsü */
  var cekmece = document.querySelector(".ust__cekmece");
  if (cekmece) {
    cekmece.addEventListener("click", function (olay) {
      if (olay.target.closest("nav a")) { cekmece.open = false; }
    });
    document.addEventListener("click", function (olay) {
      if (cekmece.open && !cekmece.contains(olay.target)) { cekmece.open = false; }
    });
    document.addEventListener("keydown", function (olay) {
      if (olay.key === "Escape" && cekmece.open) {
        cekmece.open = false;
        cekmece.querySelector("summary").focus();
      }
    });
  }

  /* 2b) Menü tek satıra sığmıyorsa (uzun çeviri) çekmeceye geç */
  var menuListe = document.querySelector(".ust__menu ul");
  function menuyuOlc() {
    if (!ust || !menuListe) { return; }
    ust.classList.remove("ust--dar");
    if (!menuListe.offsetParent) { return; } /* dar ekran kuralı menüyü zaten gizledi */
    if (menuListe.scrollHeight > menuListe.clientHeight + 1) { ust.classList.add("ust--dar"); }
  }
  if (menuListe) {
    menuyuOlc();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(menuyuOlc); }
    var menuBekleyen = 0;
    window.addEventListener("resize", function () {
      cancelAnimationFrame(menuBekleyen);
      menuBekleyen = requestAnimationFrame(menuyuOlc);
    });
  }

  /* 3) Metni kopyala */
  function eskiYontem(metin) {
    return new Promise(function (tamam, olmadi) {
      var alan = document.createElement("textarea");
      alan.value = metin;
      alan.setAttribute("readonly", "");
      alan.className = "gizli";
      document.body.appendChild(alan);
      alan.select();
      var oldu = false;
      try { oldu = document.execCommand("copy"); } catch (hata) { oldu = false; }
      document.body.removeChild(alan);
      if (oldu) { tamam(); } else { olmadi(); }
    });
  }

  function kopyala(metin) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(metin).catch(function () { return eskiYontem(metin); });
    }
    return eskiYontem(metin);
  }

  /* 4) Dev sözcükler: uzun çeviri tek satıra sığsın */
  var devler = document.querySelectorAll("[data-sigdir]");
  function sigdir(el) {
    el.style.setProperty("--sig", "1");
    el.style.whiteSpace = "nowrap";
    var dogal = el.scrollWidth;
    var genis = el.clientWidth;
    el.style.whiteSpace = "";
    if (genis > 0 && dogal > genis + 1) {
      el.style.setProperty("--sig", String(Math.floor(genis / dogal * 980) / 1000));
    }
  }
  function hepsiniSigdir() {
    Array.prototype.forEach.call(devler, sigdir);
  }
  if (devler.length) {
    hepsiniSigdir();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(hepsiniSigdir); }
    var bekleyen = 0;
    window.addEventListener("resize", function () {
      cancelAnimationFrame(bekleyen);
      bekleyen = requestAnimationFrame(hepsiniSigdir);
    });
    if ("MutationObserver" in window) {
      Array.prototype.forEach.call(devler, function (el) {
        new MutationObserver(function () { sigdir(el); })
          .observe(el, { childList: true, characterData: true, subtree: true });
      });
    }
  }

  /* 5) Sahne açılışı */
  var sahneler = document.querySelectorAll(".sahne");
  var hareketAz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sahneler.length && "IntersectionObserver" in window && !hareketAz) {
    var acici = new IntersectionObserver(function (kayitlar) {
      kayitlar.forEach(function (kayit) {
        if (!kayit.isIntersecting) { return; }
        kayit.target.classList.add("gorundu");
        if (kok.classList.contains("kaydi")) { kayit.target.classList.add("acildi"); }
        acici.unobserve(kayit.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    Array.prototype.forEach.call(sahneler, function (sahne) { acici.observe(sahne); });
    var kaydi = function () {
      kok.classList.add("kaydi");
      window.removeEventListener("scroll", kaydi);
    };
    window.addEventListener("scroll", kaydi, { passive: true });
  }

  /* 6) Kenar rayı: ekranın ortasındaki sahnenin bağlantısı işaretlenir (aria-current),
        adı rayın altında yazılır. Betik yoksa ray yine bir bağlantı listesidir. */
  var ray = document.querySelector(".ray");
  if (ray && "IntersectionObserver" in window) {
    var rayBaglari = ray.querySelectorAll("a[href^='#']");
    var raySimdi = ray.querySelector(".ray__simdi");
    var hedefler = [];
    Array.prototype.forEach.call(rayBaglari, function (bag) {
      var hedef = document.getElementById(bag.getAttribute("href").slice(1));
      if (hedef) { hedefler.push({ el: hedef, bag: bag, gorunur: false }); }
    });
    var isaretle = function () {
      var etkin = null;
      for (var i = 0; i < hedefler.length; i++) {
        if (hedefler[i].gorunur) { etkin = hedefler[i]; break; }
      }
      hedefler.forEach(function (h) {
        if (h === etkin) { h.bag.setAttribute("aria-current", "location"); }
        else { h.bag.removeAttribute("aria-current"); }
      });
      if (raySimdi) {
        var ad = etkin ? etkin.bag.querySelector(".ray__ad") : null;
        raySimdi.textContent = ad ? ad.textContent : "";
      }
      ray.classList.toggle("ray--perde", !!(etkin && etkin.el.classList.contains("sahne--kapanis")));
    };
    var rayGozcu = new IntersectionObserver(function (kayitlar) {
      kayitlar.forEach(function (kayit) {
        for (var i = 0; i < hedefler.length; i++) {
          if (hedefler[i].el === kayit.target) { hedefler[i].gorunur = kayit.isIntersecting; }
        }
      });
      isaretle();
    }, { rootMargin: "-48% 0px -51% 0px" });
    hedefler.forEach(function (h) { rayGozcu.observe(h.el); });
  }

  var dugmeler = document.querySelectorAll("[data-kopyala]");
  Array.prototype.forEach.call(dugmeler, function (dugme) {
    var kaynak = document.getElementById(dugme.getAttribute("data-kopyala"));
    var durum = document.getElementById(dugme.getAttribute("data-durum"));
    if (!kaynak) { return; }
    dugme.addEventListener("click", function () {
      var metin = kaynak.textContent.replace(/\s+/g, " ").trim();
      kopyala(metin).then(function () {
        if (durum) { durum.textContent = durum.getAttribute("data-tamam"); }
      }, function () {
        if (durum) { durum.textContent = durum.getAttribute("data-olmadi"); }
      });
    });
  });
})();
