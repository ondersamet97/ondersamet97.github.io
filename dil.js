/* töre · dil seçimi.
   Türkçe sayfaya dışarıdan gelen ziyaretçinin tarayıcı dilleri arasında Türkçe yoksa
   aynı sayfanın İngilizcesi açılır. Site içinden gelen (ör. TR düğmesine basan) ziyaretçiye
   dokunulmaz: seçim onundur. Kayıt yok, çerez yok, dışarıya istek yok. */
(function () {
  "use strict";
  try {
    var gelinen = document.referrer || "";
    if (gelinen.indexOf(location.origin + "/") === 0) return;
    if (/[?&]dil=tr(&|$)/.test(location.search)) return;
    var diller = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < diller.length; i++) {
      if (/^tr(-|$)/i.test(diller[i])) return;
    }
    var yol = location.pathname;
    var kesme = yol.lastIndexOf("/");
    location.replace(yol.slice(0, kesme + 1) + "en/" + yol.slice(kesme + 1) + location.search + location.hash);
  } catch (hata) { /* yönlendirme olmazsa Türkçe sayfa açık kalır */ }
})();
