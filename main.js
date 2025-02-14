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

// Layer untuk marker
const locationSource = new ol.source.Vector();
const locationLayer = new ol.layer.Vector({
  source: locationSource,
  style: new ol.style.Style({
      image: new ol.style.Icon({
          anchor: [0.5, 1],
          src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // 🔴 Icon merah
          scale: 0.07,
      }),
  }),
});
map.addLayer(locationLayer);

let activeMarker = null; // Menyimpan marker yang sedang ditampilkan

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

// Fungsi menampilkan lokasi pengguna (marker pertama langsung muncul popup)
function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const userCoords = ol.proj.fromLonLat([lon, lat]);

  // Tambahkan marker baru
  const userMarker = new ol.Feature({
      geometry: new ol.geom.Point(userCoords),
  });
  locationSource.addFeature(userMarker);

  // Pindahkan peta ke titik lokasi dengan zoom ke marker
  map.getView().animate({
      center: userCoords,
      zoom: 17,
      duration: 500
  });

  // Simpan marker aktif
  activeMarker = userMarker;

  // Ambil alamat menggunakan reverse geocoding dan tampilkan popup otomatis
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
          popupAddress.textContent = data.display_name;
          popupCoords.textContent = `${lon.toFixed(6)}, ${lat.toFixed(6)}`;

          // Tampilkan popup di atas marker pertama
          overlay.setPosition(userCoords);
          popup.style.display = 'block';
      });

  // Simpan data lokasi untuk popup saat marker diklik
  userMarker.setProperties({
      lat: lat,
      lon: lon
  });
}

// Fungsi menangani klik di peta (tambah marker & popup)
map.on('click', function (event) {
  const clickedCoords = ol.proj.toLonLat(event.coordinate);
  const lon = clickedCoords[0];
  const lat = clickedCoords[1];

  // Tambahkan marker baru
  const clickedMarker = new ol.Feature({
      geometry: new ol.geom.Point(event.coordinate),
  });
  locationSource.addFeature(clickedMarker);

  // Simpan marker aktif
  activeMarker = clickedMarker;

  // Ambil alamat menggunakan reverse geocoding OpenStreetMap
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
          popupAddress.textContent = data.display_name;
          popupCoords.textContent = `${lon.toFixed(6)}, ${lat.toFixed(6)}`;

          // Tampilkan popup di atas marker
          overlay.setPosition(event.coordinate);
          popup.style.display = 'block';
      });

  // Simpan data lokasi untuk popup saat marker diklik
  clickedMarker.setProperties({
      lat: lat,
      lon: lon
  });
});

// Fungsi menutup popup dan menghapus marker yang aktif
closePopup.addEventListener('click', () => {
  popup.style.display = 'none';
  if (activeMarker) {
      locationSource.removeFeature(activeMarker);
      activeMarker = null;
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
