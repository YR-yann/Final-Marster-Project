// App.js
import React, { useState } from "react";
import ExercisesPage from "./components/ExercisesPage";
import HomePage from "./components/HomePage";
import LandingPage from "./components/LandingPage";
ajout-main
import SettingsPage from './components/SettingsPage';

import "./index.css";
master

function App() {
  const [currentPage, setCurrentPage] = useState("landing"); // 'landing', 'home', 'exercises'
  const [isLoggedIn, setIsLoggedIn] = useState(currentPage !== "landing"); // Nouveau state pour le statut de connexion

  const goToHomePage = () => {
    setCurrentPage("home");
    setIsLoggedIn(true); // Supposons que l'accès à home signifie être connecté
  };

  const goToExercisesPage = () => {
    setCurrentPage("exercises");
    setIsLoggedIn(true); // Supposons que l'accès aux exercices signifie être connecté
  };

  const goToLandingPage = () => {
    setCurrentPage("landing");
    setIsLoggedIn(false); // Déconnexion
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'exercises':
        return <ExercisesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <LandingPage onLoginClick={goToHomePage} onSignupClick={goToHomePage} />;
    }
  };

  const navButtonStyle = {
    padding: '8px 15px',
    marginRight: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '1em'
  };

  const activeNavButtonStyle = { ...navButtonStyle, backgroundColor: '#0056b3' };
  const logoutButtonStyle = { ...navButtonStyle, backgroundColor: '#dc3545', marginRight: '0' };

  return (
    <div className="app">
ajout-main
      {/* Navigation */}
      {isLoggedIn && (
        <nav style={{
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: '#e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <button 
              onClick={goToHomePage} 
              style={currentPage === 'home' ? activeNavButtonStyle : navButtonStyle}
            >
              Accueil
            </button>
            <button 
              onClick={goToExercisesPage}
              style={currentPage === 'exercises' ? activeNavButtonStyle : {...navButtonStyle, marginRight: '0'}}
            >
              Exercices
            </button>
             <button 
              onClick={() => setCurrentPage('settings')}
              style={currentPage === 'settings' ? activeNavButtonStyle : {...navButtonStyle, marginLeft: '20px', marginRight: '0'}}
            >
              Paramètres
            </button>
          </div>
          <div>
             <button 
              onClick={goToLandingPage}
              style={logoutButtonStyle}
            >
              Déconnexion
            </button>

      {/* Navigation (simple boutons pour l'exemple) */}
      {currentPage !== "landing" && (
        <nav className="navbar">
          <div className="navbar-content">
            <h1 style={{ color: "var(--primary-color)", margin: 0 }}>Éloquence</h1>
            <div className="nav-buttons">
              <button onClick={goToHomePage}>Accueil</button>
              <button onClick={goToExercisesPage}>Exercices</button>
              <button onClick={goToLandingPage} style={{ backgroundColor: "var(--danger-color)" }}>
                Déconnexion
              </button>
            </div>
master
          </div>
        </nav>
      )}

ajout-main
      {/* Contenu de la page actuelle */}
      <div style={{ padding: '0 20px 20px 20px' }}>
        {renderPage()}

      {/* Affichage conditionnel des pages */}
      <div className="container">
        {currentPage === "landing" && <LandingPage onLoginClick={goToHomePage} onSignupClick={goToHomePage} />} {/* Pour l'instant, login/signup redirigent vers home */}
        {currentPage === "home" && <HomePage />}
        {currentPage === "exercises" && <ExercisesPage />}
master
      </div>
    </div>
  );
}

export default App;
