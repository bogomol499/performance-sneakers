/* =========================================================
   Performance — каталог магазина.
   Фото: Unsplash (бесплатная лицензия), авторы указаны у каждой пары.
   Цены демонстрационные: магазин вымышленный.
   gender: 'm' — мужчинам, 'w' — женщинам, 'u' — унисекс
   ========================================================= */
window.PF_DATA = (() => {
  'use strict';

  // Фото лежат в папке img/ (скачаны с Unsplash), чтобы сайт работал везде и без интернета
  const FILES = {
    '1550399865-ec7d23b18e8e': 'p-am95', '1552346154-21d32810aba3': 'p-aj1low', '1597350584914-55bb62285896': 'p-af1',
    '1747691875590-14db938e42d4': 'p-am1green', '1750929471162-c8b9a7e3613b': 'p-dunklow', '1758665630748-08141996c144': 'p-superstar',
    '1718220095476-7916e897fc55': 'p-sambablack', '1600185365926-3a2ce3cdb9eb': 'p-am1', '1595950653106-6c9ebd614d3a': 'p-af1shadow',
    '1584735175315-9d5df23860e6': 'p-dunkhigh', '1542291026-7eec264c27ff': 'p-freern', '1710504989866-1db8de4b4034': 'p-sambagold',
    '1695552835054-95b185af3d11': 'p-sambagreen', '1725271741216-743c37073437': 'p-ggmay',
    '1600185365483-26d7a4cc7519': 'look-1', '1695552836001-e34239c9c9d4': 'look-2', '1746206434527-b02438fc36af': 'look-3',
    '1725271741207-b727541e983e': 'look-4', '1600185365778-7875a359b924': 'look-5', '1725271741302-4b87691dde86': 'look-6'
  };
  const img = id => FILES[id] ? `img/${FILES[id]}.jpg` : `https://images.unsplash.com/photo-${id}?w=1100&q=80&auto=format&fit=crop`;

  const BRANDS = ['Nike', 'Adidas', 'Golden Goose'];

  const PRODUCTS = [
    { id: 'am95', brand: 'Nike', name: 'Air Max 95', color: 'Тёмно-бирюзовый', gender: 'm', price: 19990, tag: 'Хит',
      photo: '1550399865-ec7d23b18e8e', pos: '50% 60%', author: 'Nikita Kachanovsky', src: 'https://unsplash.com/photos/black-and-white-nike-air-max-95-sneaker-ad_0wMHtvlU',
      text: 'Волнистые боковины, видимый Air в пятке и носке. Классика 1995 года, которая до сих пор выглядит как из будущего.', soldOut: [46] },
    { id: 'aj1low', brand: 'Nike', name: 'Air Jordan 1 Low', color: 'Белый, чёрный, красный', gender: 'm', price: 14990,
      photo: '1552346154-21d32810aba3', pos: '50% 55%', author: 'Taylor Smith', src: 'https://unsplash.com/photos/pair-of-black-white-and-red-air-jordan-1-shoes-aDZ5YIuedQg',
      text: 'Баскетбольная легенда в низком силуэте. Кожаный верх и узнаваемые цвета, которые подходят ко всему.', soldOut: [40, 41] },
    { id: 'af1', brand: 'Nike', name: "Air Force 1 '07", color: 'Белый', gender: 'u', price: 12990, tag: 'Хит',
      photo: '1597350584914-55bb62285896', pos: '50% 60%', author: 'Brian Hall', src: 'https://unsplash.com/photos/white-nike-air-force-1-x5aavOm7PFc',
      text: 'Те самые белые «форсы». Плотная кожа, толстая подошва и ни одной лишней детали.', soldOut: [] },
    { id: 'am1green', brand: 'Nike', name: 'Air Max 1', color: 'Белый, серый, зелёный', gender: 'm', price: 18490, tag: 'Новинка',
      photo: '1747691875590-14db938e42d4', pos: '50% 50%', author: 'Vlad Ciutacu', src: 'https://unsplash.com/photos/a-nike-air-max-1-sneaker-floats-gracefully-sgRh0WENun0',
      text: 'Первая модель с видимым воздушным блоком. Замша и сетка в сочных весенних цветах.', soldOut: [39] },
    { id: 'dunklow', brand: 'Nike', name: 'Dunk Low', color: 'Бежевая замша', gender: 'm', price: 13990,
      photo: '1750929471162-c8b9a7e3613b', pos: '50% 60%', author: 'Vlad Ciutacu', src: 'https://unsplash.com/photos/beige-suede-sneaker-with-gum-sole-FerGPoi0Zwg',
      text: 'Мягкая бежевая замша и каучуковая подошва. Спокойный цвет на каждый день.', soldOut: [44, 45] },
    { id: 'superstar', brand: 'Adidas', name: 'Superstar', color: 'Белый, чёрные полоски', gender: 'u', price: 10990,
      photo: '1758665630748-08141996c144', pos: '50% 55%', author: 'Murphy Stay', src: 'https://unsplash.com/photos/a-black-and-white-adidas-superstar-sneaker-hWXwsSyEx3E',
      text: 'Резиновый «ракушечный» мысок и три полоски. С 1969 года почти не изменились — и не нужно.', soldOut: [37] },
    { id: 'sambablack', brand: 'Adidas', name: 'Samba OG', color: 'Белый, чёрный', gender: 'm', price: 12490,
      photo: '1718220095476-7916e897fc55', pos: '50% 60%', author: 'Cris', src: 'https://unsplash.com/photos/a-white-and-black-adidas-sneakers-on-a-wooden-floor-fIflxqqzBQY',
      text: 'Футбольные кеды для зала, ставшие главной уличной парой. Кожа, замшевый мысок, каучук.', soldOut: [42] },

    { id: 'am1', brand: 'Nike', name: 'Air Max 1 Ultra', color: 'Белый, оранжевый', gender: 'w', price: 17990, tag: 'Хит',
      photo: '1600185365926-3a2ce3cdb9eb', pos: '50% 50%', author: 'Luis Felipe Lins', src: 'https://unsplash.com/photos/white-and-orange-athletic-sneaker-LG88A2XgIXY',
      text: 'Облегчённая версия легенды: бесшовная сетка и мягкий воздушный блок. Весит почти как носок.', soldOut: [35] },
    { id: 'af1shadow', brand: 'Nike', name: 'Air Force 1 Shadow', color: 'Пастель', gender: 'w', price: 14490, tag: 'Новинка',
      photo: '1595950653106-6c9ebd614d3a', pos: '50% 55%', author: 'Ryan Plomp', src: 'https://unsplash.com/photos/pastel-sneakers-on-geometric-surface-jvoZ-Aux9aw',
      text: 'Двойные детали, двойной логотип и пастельные цвета. Самые весенние «форсы».', soldOut: [38] },
    { id: 'dunkhigh', brand: 'Nike', name: 'Dunk High', color: 'Персик, голубой, каучук', gender: 'w', price: 15990,
      photo: '1584735175315-9d5df23860e6', pos: '50% 60%', author: 'Giorgio Trovato', src: 'https://unsplash.com/photos/white-and-brown-nike-sneaker-LV_4qM5Gf9c',
      text: 'Высокий силуэт с мягкой манжетой и цветными вставками. Отлично смотрится с юбкой и с джинсами.', soldOut: [36, 40] },
    { id: 'freern', brand: 'Nike', name: 'Free RN Flyknit', color: 'Красный', gender: 'w', price: 11990,
      photo: '1542291026-7eec264c27ff', pos: '50% 50%', author: 'Ryan Waring', src: 'https://unsplash.com/photos/unpaired-red-nike-sneaker-164_6wVEHfI',
      text: 'Вязаный верх и гибкая подошва для лёгких пробежек по набережной.', soldOut: [] },
    { id: 'sambagold', brand: 'Adidas', name: 'Samba OG', color: 'Белый, золото', gender: 'w', price: 13990, tag: 'Лимитка',
      photo: '1710504989866-1db8de4b4034', pos: '50% 60%', author: 'SJ', src: 'https://unsplash.com/photos/a-pair-of-white-and-gold-adidas-sneakers-K4CcpbJYnac',
      text: 'Золотые полоски и подвеска на шнурках. Праздничная версия самых популярных кед сезона.', soldOut: [39, 40] },
    { id: 'sambagreen', brand: 'Adidas', name: 'Samba OG', color: 'Белый, зелёный', gender: 'u', price: 12490,
      photo: '1695552835054-95b185af3d11', pos: '50% 70%', author: 'SJ', src: 'https://unsplash.com/photos/a-pair-of-white-and-green-adidas-sneakers-Y5pcyypfuLE',
      text: 'Зелёные полоски на белой коже и каучуковая подошва. Подходят и ему, и ей.', soldOut: [41] },
    { id: 'ggmay', brand: 'Golden Goose', name: 'May Strap', color: 'Белая кожа, звезда', gender: 'w', price: 49900, tag: 'Премиум',
      photo: '1725271741216-743c37073437', pos: '50% 60%', author: 'SJ', src: 'https://unsplash.com/photos/a-white-sneaker-with-a-black-and-white-star-on-the-side-wHUlMvFHEbA',
      text: 'Итальянская ручная работа: мягкая кожа, звезда на боку и липучки вместо шнурков. Слегка «состаренный» вид задуман специально.', soldOut: [35, 41] }
  ];

  // Первый экран: главные пары
  const HERO = ['am1', 'sambagreen', 'aj1low', 'af1shadow'];

  // Разделы «Мужчинам» / «Женщинам»
  const SECTIONS = {
    m: { title: 'Мужчинам', lead: 'Air Max, Jordan, Dunk и классика Adidas.', cover: '1550399865-ec7d23b18e8e', pos: '70% 62%' },
    w: { title: 'Женщинам', lead: 'Пастельные «форсы», Samba в золоте и Golden Goose.', cover: '1595950653106-6c9ebd614d3a', pos: '50% 55%' }
  };

  // Лукбук: только предметная съёмка, без людей
  const LOOKBOOK = [
    { photo: '1600185365483-26d7a4cc7519', title: 'Nike Air Max 1 Ultra', author: 'Luis Felipe Lins', src: 'https://unsplash.com/photos/white-and-red-nike-athletic-shoe-J2-wAQDckus' },
    { photo: '1695552836001-e34239c9c9d4', title: 'Adidas Samba OG', author: 'SJ', src: 'https://unsplash.com/photos/a-pair-of-white-and-green-adidas-sneakers-j86izBICXHY' },
    { photo: '1746206434527-b02438fc36af', title: 'Nike Air Max 1', author: 'Vlad Ciutacu', src: 'https://unsplash.com/photos/a-green-and-white-nike-air-max-sneaker-lSffwHqXDV8' },
    { photo: '1725271741207-b727541e983e', title: 'Golden Goose May', author: 'SJ', src: 'https://unsplash.com/photos/a-pair-of-white-and-black-sneakers-on-a-white-surface-OEtXKODuGYk' },
    { photo: '1600185365778-7875a359b924', title: 'Nike Air Max 1 Ultra', author: 'Luis Felipe Lins', src: 'https://unsplash.com/photos/white-red-and-black-nike-athletic-shoe-S6Cp3uN39_M' },
    { photo: '1725271741302-4b87691dde86', title: 'Golden Goose в коробке', author: 'SJ', src: 'https://unsplash.com/photos/a-pair-of-white-sneakers-in-a-box-uIWfpSURyeM' }
  ];

  // Размеры EU и длина стопы в сантиметрах
  const SIZES = { m: [39, 40, 41, 42, 43, 44, 45, 46], w: [35, 36, 37, 38, 39, 40, 41], u: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45] };
  const FOOT = { 35: 22, 36: 22.5, 37: 23.5, 38: 24, 39: 25, 40: 25.5, 41: 26.5, 42: 27, 43: 28, 44: 28.5, 45: 29.5, 46: 30 };
  const US = { m: { 39: 6.5, 40: 7, 41: 8, 42: 8.5, 43: 9.5, 44: 10, 45: 11, 46: 12 }, w: { 35: 5, 36: 5.5, 37: 6.5, 38: 7, 39: 8, 40: 8.5, 41: 9.5 } };

  const PROMOS = {
    POKROVKA10: { percent: 10, text: 'Скидка 10%' },
    'ПЕРВЫЙ': { fixed: 1000, text: 'Скидка 1 000 ₽ на первый заказ' }
  };

  const DELIVERY = [
    { id: 'pickup', name: 'Самовывоз с Покровки', price: 0, note: 'Сегодня после 16:00' },
    { id: 'courier', name: 'Курьер по Москве', price: 490, freeFrom: 20000, note: 'За 3 часа, с примеркой' },
    { id: 'russia', name: 'По России', price: 690, note: '2–5 дней' }
  ];

  const DROP = { id: 'am95', title: 'Air Max 95', pairs: 120, pos: '72% 62%' };

  return { img, BRANDS, PRODUCTS, HERO, SECTIONS, LOOKBOOK, SIZES, FOOT, US, PROMOS, DELIVERY, DROP };
})();
