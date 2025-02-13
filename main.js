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
    navigator.geolocation.getCurrentPosition(
      showPosition,
      showError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    Swal.fire({
      title: "Error",
      text: "Geolocation tidak didukung di browser ini.",
      icon: "error",
    });
  }
});

// Fungsi menampilkan lokasi pengguna
function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const userCoords = ol.proj.fromLonLat([lon, lat]);

  // **Hapus marker lama sebelum menambahkan yang baru**
  userLocationSource.clear();

  // **Tambahkan marker ke lokasi pengguna**
  const userMarker = new ol.Feature({
    geometry: new ol.geom.Point(userCoords),
  });
  userLocationSource.addFeature(userMarker);

  // **Update tampilan peta ke titik marker secara langsung (bukan animasi)**
  map.getView().setCenter(userCoords);
  map.getView().setZoom(17);

  // **Ambil alamat menggunakan reverse geocoding OpenStreetMap**
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
      popupAddress.textContent = data.display_name || "Alamat tidak ditemukan";
      popupCoords.textContent = `${lon.toFixed(6)}, ${lat.toFixed(6)}`;

      // **Tampilkan popup di atas marker**
      overlay.setPosition(userCoords);
      popup.style.display = 'block';
    })
    .catch(() => {
      popupAddress.textContent = "Data lokasi tidak ditemukan";
      popupCoords.textContent = `${lon.toFixed(6)}, ${lat.toFixed(6)}`;
      overlay.setPosition(userCoords);
      popup.style.display = 'block';
    });
}

// Fungsi menangani error geolocation
function showError(error) {
  let errorMessage;
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = "Pengguna menolak permintaan geolocation.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = "Informasi lokasi tidak tersedia.";
      break;
    case error.TIMEOUT:
      errorMessage = "Permintaan lokasi melebihi waktu.";
      break;
    case error.UNKNOWN_ERROR:
      errorMessage = "Terjadi kesalahan yang tidak diketahui.";
      break;
  }
  Swal.fire({
    title: "Error",
    text: errorMessage,
    icon: "error",
  });
}

// Fungsi menutup pop-up
closePopup.addEventListener('click', () => {
  popup.style.display = 'none';
  overlay.setPosition(undefined);
});