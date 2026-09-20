(function () {
  const base = "image/products/";
  const products = {
    "1 Litre Acılı Şalgam":"1lacilisalgam.webp",
    "1 Litre Tatlı Şalgam":"1ltatlisalgam.webp",
    "1,5 L Su":"1-5lsu.webp",
    "Acılı Atom":"aciliatom.webp",
    "Acılı Ezme":"aciliezme.webp",
    "Antrikot":"antrikot.webp",
    "Ayran":"ayran.webp",
    "Barbunya":"barbunya.webp",
    "Bardak Şalgam":"bardaksalgam.webp",
    "Beck's":"becksbira.webp",
    "Belfast":"belfast.webp",
    "Bomonti Filtresiz":"bomonti-filtresiz.webp",
    "Bonfile":"bonfile.webp",
    "Bonfile 1.5":"bonfile.webp",
    "Bud":"budbira.webp",
    "Churchill":"churchill.webp",
    "Coca-Cola":"coca-cola.webp",
    "Corona Cerveza":"coronacerveza.webp",
    "Deniz Börülcesi":"denizborulcesi.webp",
    "Domates Salatalık Söğüş":"domates-salatalik-sogus.webp",
    "Doritos & Ruffles":"doritosruffles.webp",
    "Dört Peynirli Makarna":"dortpeynirlimakarna.webp",
    "Efes Lager Green":"efeslagergreen.webp",
    "Efes Lager Malt":"efeslagermalt.webp",
    "Efes Lager Pilsen":"efeslagerpilsen.webp",
    "Ekşili Mantar":"eksilimantar.webp",
    "Elma Suyu":"elmasuyu.webp",
    "Ezine Peyniri":"ezinepeynirmeze.webp",
    "Fanta":"fanta.webp",
    "Fırında Kaşarlı Makarna":"firindakasarlimakarna.webp",
    "Gavurdağı Salata":"gavurdagisalata.webp",
    "Havuç Tarator":"havuctarator.webp",
    "Haydari":"haydari.webp",
    "Jalapeno Biber Turşusu":"jalapenobibertursusu.webp",
    "Kanat":"kanat.webp",
    "Karışık Çerez":"karisikcerez.webp",
    "Kaşarlı Mantar":"kasarlimantar.webp",
    "Kaşık Salata":"kasiksalata.webp",
    "Kuru Cacık":"kurucacik.webp",
    "Köfte":"kofte.webp",
    "Köz Biber Patlıcan Salatası":"kozbiberpatlicansalatasi.webp",
    "Kırmızı Biber":"kirmizibibermeze.webp",
    "Mantarlı Kremalı Makarna":"mantarli-kremali-makarna.webp",
    "Meyveli Soda":"meyvelisoda.webp",
    "Miller Genuine Draft":"miller-genuine-draft.webp",
    "Nescafe":"nescafe.webp",
    "Patates Kızartması":"patateskizartmasi.webp",
    "Pembe Sultan":"pembesultanmezesi.webp",
    "Pirzola":"pirzola.webp",
    "Pirzola 1.5":"pirzola.webp",
    "Popcorn":"popcorn.webp",
    "Red Bull":"redbull.webp",
    "Red Bull Büyük":"redbullbuyuk.webp",
    "Roka Salata":"rokasalatasi.webp",
    "Rus Salatası":"russalatasi.webp",
    "Sade Soda":"sadesoda.webp",
    "Salatalık Havuç":"salatalikhavucsalatasi.webp",
    "Salatalık Turşusu":"salataliktursusu.webp",
    "Saç Kavurma":"sackavurma.webp",
    "Schweppes":"schweppes.webp",
    "Semizotlu Yoğurt":"semizotluyogurt.webp",
    "Spaghetti":"spaghetti.webp",
    "Stella Artois":"stellaartois.webp",
    "Sucuk":"sucuk.webp",
    "Tavuk Pirzola":"tavukpirzola.webp",
    "Tavuklu Körili Penne":"tavuklu-korili-penne.webp",
    "Tereyağlı Mantar":"tereyaglimantar.webp",
    "Tereyağlı Patlıcan":"tereyaglipatlican.webp",
    "Ton Balıklı Salata":"tonbaliklisalata.webp",
    "Tuzlu Fıstık":"tuzlufistik.webp",
    "Tuzlu Leblebi":"tuzluleblebi.webp",
    "Türk Kahvesi":"turkkahvesi.webp",
    "Vişne Suyu":"visnesuyu.webp",
    "Yaprak Ciğer":"yaprakciger.webp",
    "Yaprak Sarması":"yapraksarmasi.webp",
    "Yeşil Salata":"yesilsalata.webp",
    "Yoğurt":"yogurt.webp",
    "Yoğurtlu Köz Patlıcan":"yogurtlukozpatlican.webp",
    "Zeytin":"zeytin.webp",
    "Çay":"cay.webp",
    "Çikolata Jelibon":"cikolatajelibon.webp",
    "Çiğ Köfte":"cigkoftemeze.webp",
    "Çoban Salatası":"cobansalata.webp",
    "Çıtır Tavuk":"citirtavuk.webp",
    "Şakşuka":"saksukameze.webp"
  };
  const groups = {
    "Beylerbeyi":"beylerbeyi.webp",
    "Efe Gold":"efegold.webp",
    "İstanbul":"istanbul-blue.webp",
    "İstanbul Blue":"istanbul-blue.webp",
    "Tekirdağ Altın Seri":"tekirdagaltinseri.webp",
    "Chivas":"chivas.webp",
    "Gilbey's Gin":"gilbeys-gin.webp",
    "Olmeca":"olmeca.webp"
  };
  window.GDZ_PRODUCT_IMAGES = products;
  window.applyGDZProductImages = function (menu) {
    const revision = "2026-09-21-photos-v1";
    if (!Array.isArray(menu) || !menu.length || menu[0].photoRevision === revision) return menu;
    menu.forEach(category => {
      if (Array.isArray(category.groups)) {
        category.groups.forEach(group => {
          const filename = groups[group.title];
          if (!filename) return;
          group.image = base + filename;
          (group.items || []).forEach(item => { item.image = base + filename; });
        });
      } else {
        (category.items || []).forEach(item => {
          const filename = products[item.name];
          if (filename) item.image = base + filename;
        });
      }
    });
    menu[0].photoRevision = revision;
    return menu;
  };
})();
