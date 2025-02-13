// Inisialisasi peta
const map = new ol.Map({
  target: 'map',
  layers: [
      new ol.layer.Tile({
          source: new ol.source.OSM(),
      }),
  ],
  view: new ol.View({
      center: ol.proj.fromLonLat([0, 0]), // Default ke koordinat awal
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
          src: 'https://cdn-icons-png.flaticon.com/512/447/447031.png', // Pin merah
          scale: 0.07,
      }),
  }),
});
map.addLayer(userLocationLayer);

// Fungsi mendapatkan lokasi pengguna
document.getElementById('getLocation').addEventListener('click', function () {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError, {
          enableHighAccuracy: true, // Meningkatkan akurasi
          timeout: 10000,
          maximumAge: 0
      });
  } else {
      alert("Geolocation tidak didukung di browser ini.");
  }
});

// Fungsi menampilkan lokasi pengguna
function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const userCoords = ol.proj.fromLonLat([lon, lat]);

  // Tambahkan marker ke lokasi pengguna
  userLocationSource.clear();
  const userMarker = new ol.Feature({
      geometry: new ol.geom.Point(userCoords),
  });
  userLocationSource.addFeature(userMarker);

  // **Geser tampilan peta ke lokasi pengguna dan zoom otomatis**
  map.getView().animate({ center: userCoords, zoom: 17, duration: 1000 });

  // Ambil alamat menggunakan reverse geocoding OpenStreetMap
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
          popupAddress.textContent = data.display_name;
          popupCoords.textContent = `${lon.toFixed(6)}, ${lat.toFixed(6)}`;

          // **Tampilkan popup di atas marker**
          overlay.setPosition(userCoords);
          popup.style.display = 'block';
      });
}

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

// Fungsi menutup pop-up
closePopup.addEventListener('click', () => {
  popup.style.display = 'none';
});
