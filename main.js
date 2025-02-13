// Inisialisasi peta
const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([0, 0]), // Default awal
    zoom: 2,
  }),
});

// Inisialisasi pop-up
const popup = document.getElementById('popup');
const popupAddress = document.getElementById('popupAddress');
const popupCoords = document.getElementById('popupCoords');
const closePopup = document.getElementById('closePopup');

const overlay = new ol.Overlay({
  element: popup,
  autoPan: true,
  positioning: 'bottom-center',
});
map.addOverlay(overlay);

// Layer untuk marker lokasi pengguna
const userLocationSource = new ol.source.Vector();
const userLocationLayer = new ol.layer.Vector({
  source: userLocationSource,
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // 🔴 Icon merah
      scale: 0.07,
    }),
  }),
});
map.addLayer(userLocationLayer);


// Fungsi mendapatkan lokasi pengguna
document.getElementById('getLocation').addEventListener('click', function () {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
      });
  } else {
      alert("Geolocation tidak didukung di browser ini.");
  }
});

// Fungsi menampilkan lokasi pengguna (tanpa popup langsung muncul)
function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const userCoords = ol.proj.fromLonLat([lon, lat]);

  // Hapus marker lama dan tambahkan marker baru
  userLocationSource.clear();
  const userMarker = new ol.Feature({
      geometry: new ol.geom.Point(userCoords),
  });
  userLocationSource.addFeature(userMarker);

  // Pindahkan peta ke titik lokasi dengan zoom langsung ke marker
map.getView().animate({
  center: userCoords,
  zoom: 20, // Zoom lebih dekat ke titik marker
  duration: 500 // Efek animasi lebih smooth
});


  // Simpan data lokasi untuk popup saat marker diklik
  userMarker.setProperties({
      lat: lat,
      lon: lon
  });
}

// Tambahkan event listener untuk menampilkan popup saat marker diklik
map.on('click', function (event) {
  const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
      return feature;
  });

  if (feature) {
      const lat = feature.get('lat');
      const lon = feature.get('lon');

      // Ambil alamat menggunakan reverse geocoding OpenStreetMap
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          .then(response => response.json())
          .then(data => {
              popupAddress.textContent = data.display_name;
              popupCoords.textContent = `${lon.toFixed(6)}, ${lat.toFixed(6)}`;

              // Tampilkan popup di atas marker
              overlay.setPosition(ol.proj.fromLonLat([lon, lat]));
              popup.style.display = 'block';
          });
  } else {
      // Sembunyikan popup jika klik di luar marker
      popup.style.display = 'none';
  }
});

// Fungsi menangani error geolocation
function showError(error) {
  switch (error.code) {
      case error.PERMISSION_DENIED:
          alert("Pengguna menolak permintaan geolocation.");
          break;
      case error.POSITION_UNAVAILABLE:
          alert("Informasi lokasi tidak tersedia.");
          break;
      case error.TIMEOUT:
          alert("Permintaan lokasi melebihi waktu.");
          break;
      case error.UNKNOWN_ERROR:
          alert("Terjadi kesalahan yang tidak diketahui.");
          break;
  }
}

// Fungsi menutup popup
closePopup.addEventListener('click', () => {
  popup.style.display = 'none';
});
