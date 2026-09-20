const firebaseConfig = {
  apiKey: "AIzaSyBB_ZNrp8CRx6doB6U45-man-W8C3USn-Y",
  authDomain: "gdzres.firebaseapp.com",
  databaseURL: "https://gdzres-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gdzres",
  storageBucket: "gdzres.firebasestorage.app",
  messagingSenderId: "375946616820",
  appId: "1:375946616820:web:3f270b675cf3af019ce3a1",
  measurementId: "G-P7GYK06Z9S"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
window.gdzDatabase = firebase.database();
