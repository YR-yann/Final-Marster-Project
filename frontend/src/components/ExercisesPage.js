import React, { useEffect, useRef, useState } from "react";
import styles from './ExercisesPage.module.css'; // Import des styles

export default function ExercisesPage() {
  const [exercises, setExercises] = useState({});
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [stats, setStats] = useState({
    totalExercises: 0,
    completedExercises: 0,
    averageScore: 0,
    bestCategory: "",
    bestScore: 0
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Utiliser useRef pour stocker l'instance de MediaRecorder
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
ajout-main
    loadExercises();
    loadStats();

    fetch("http://localhost:8001/exercises/list")
      .then(res => res.json())
      .then(data => {
        setExercises(data);
        const firstCat = Object.keys(data)[0];
        setCategory(firstCat);
        setQuestion(data[firstCat][0]);
      });
master
  }, []);

  const loadExercises = async () => {
    try {
      const res = await fetch("http://localhost:8000/exercises/list");
      const data = await res.json();
      setExercises(data);
      const firstCat = Object.keys(data)[0];
      setCategory(firstCat);
      setQuestion(data[firstCat][0]);
    } catch (error) {
      setError("Erreur lors du chargement des exercices");
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions/");
      const sessions = await res.json();
      
      // Filtrer les sessions d'exercices
      const exerciseSessions = sessions.filter(s => s.type === "exercice");
      
      // Calculer les statistiques
      const stats = {
        totalExercises: exerciseSessions.length,
        completedExercises: exerciseSessions.length,
        averageScore: exerciseSessions.reduce((acc, curr) => acc + (curr.exerciseScore || 0), 0) / exerciseSessions.length || 0,
        bestCategory: "",
        bestScore: 0
      };

      // Trouver la meilleure catégorie
      const categoryScores = {};
      exerciseSessions.forEach(session => {
        if (session.exerciseCategory) {
          categoryScores[session.exerciseCategory] = (categoryScores[session.exerciseCategory] || 0) + (session.exerciseScore || 0);
        }
      });

      const bestCategory = Object.entries(categoryScores)
        .sort(([,a], [,b]) => b - a)[0];

      if (bestCategory) {
        stats.bestCategory = bestCategory[0];
        stats.bestScore = bestCategory[1];
      }

      setStats(stats);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  const handleCategoryChange = e => {
    const cat = e.target.value;
    setCategory(cat);
    setQuestion(exercises[cat][0]);
    setAnswer("");
    setResult(null);
  };

  const handleQuestionChange = e => {
    setQuestion(e.target.value);
    setAnswer("");
    setResult(null);
  };

  // Fonction pour démarrer/stopper l'enregistrement audio (basique)
  const handleRecord = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Ton navigateur ne supporte pas l'enregistrement audio.");
      }

      if (recording) {
        mediaRecorderRef.current.stop();
        setRecording(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 44100,
            sampleSize: 16
          } 
        });

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const mr = new MediaRecorder(stream, {
          mimeType: mimeType,
          audioBitsPerSecond: 128000
        });

        mediaRecorderRef.current = mr;
        let chunks = [];

        mr.ondataavailable = e => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mr.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          setAudioBlob(blob);
          chunks = [];
          stream.getTracks().forEach(track => track.stop());
        };

        mr.start(1000);
        setRecording(true);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Fonction pour sauvegarder le résultat de l'exercice
  const saveExerciseResult = async (exerciseAnswer, evaluationResult) => {
    try {
      const payload = {
        user: "big_boss",
        category,
        question,
        exerciseAnswer,
        evaluationResult
      };

      const res = await fetch("http://localhost:8000/exercises/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la sauvegarde du résultat");
      }

    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      loadStats(); // Recharger les stats après sauvegarde réussie
    }
  };

  // Envoyer la réponse texte classique
  const handleSubmitText = async e => {
    e.preventDefault();
ajout-main
    if (!answer.trim()) {
      setError("Réponds d'abord, big boss!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        user: "big_boss",
        category,
        question,
        answer
      };

      const res = await fetch("http://localhost:8000/exercises/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const evaluationResult = await res.json();
      setResult(evaluationResult);
      await saveExerciseResult(answer, evaluationResult);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }

    if (!answer.trim()) return alert("Réponds d'abord, big boss!");

    const payload = {
      user: "big_boss",
      category,
      question,
      answer
    };

    const res = await fetch("http://localhost:8001/exercises/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setResult(data);
master
  };

  // Envoyer l'audio au backend pour transcription et évaluation orale
  const handleSubmitAudio = async () => {
    if (!audioBlob) {
      setError("Enregistre ta voix d'abord!");
      return;
    }

    setIsLoading(true);
    setError(null);

ajout-main
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "repetition.webm");

    // Étape 1: Envoyer l'audio pour transcription
    const transcribeRes = await fetch("http://localhost:8001/transcribe/", {
      method: "POST",
      body: formData
    });
master

      const transcribeRes = await fetch("http://localhost:8000/transcribe/", {
        method: "POST",
        body: formData
      });

      if (!transcribeRes.ok) {
        const errorData = await transcribeRes.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const transcriptionData = await transcribeRes.json();

      const evaluationPayload = {
        user: "big_boss",
        category,
        question,
        answer: transcriptionData.transcription,
        transcription_data: transcriptionData
      };

      const evaluateRes = await fetch("http://localhost:8000/exercises/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationPayload)
      });

      if (!evaluateRes.ok) {
        const errorData = await evaluateRes.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

ajout-main
      const evaluationResult = await evaluateRes.json();
      setResult(evaluationResult);
      await saveExerciseResult(transcriptionData.transcription, evaluationResult);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Exercices d'Orthéloquence</h1>

      {/* Statistiques */}
      <div className={styles.statsSection}>
        <h2>Vos Statistiques</h2>
        <div className={styles.statsGrid}>
          <div>
            <p><strong className={styles.boldText}>Exercices complétés :</strong> {stats.completedExercises}</p>
            <p><strong className={styles.boldText}>Score moyen :</strong> {stats.averageScore.toFixed(1)}%</p>
          </div>
          <div>
            <p><strong className={styles.boldText}>Meilleure catégorie :</strong> {stats.bestCategory}</p>
            <p><strong className={styles.boldText}>Meilleur score :</strong> {stats.bestScore}%</p>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Sélection de l'exercice */}
      <div className={styles.selectionSection}>
        <select 
          value={category} 
          onChange={handleCategoryChange}
          className={styles.select}
        >
          {Object.keys(exercises).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          value={question} 
          onChange={handleQuestionChange}
          className={styles.select}
        >
          {exercises[category]?.map(q => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>

      {/* Exercice actuel */}
      <div className={styles.exerciseSection}>
        <h3>Exercice en cours :</h3>
        <p className={styles.questionText}>{question}</p>

        {/* Réponse texte */}
        {category !== "Oral" && (
          <form onSubmit={handleSubmitText} className={styles.form}>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Écris ta réponse ici..."
              className={styles.textarea}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading ? "Évaluation en cours..." : "Soumettre la réponse"}
            </button>
          </form>
        )}

        {/* Enregistrement audio */}
        <div>
          <button
            onClick={handleRecord}
            className={recording ? styles.stopRecordButton : styles.recordButton}
          >
            {recording ? "⏹️ Arrêter" : "🎙️ Enregistrer"}
          </button>

          {audioBlob && (
            <button
              onClick={handleSubmitAudio}
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading ? "Évaluation en cours..." : "Soumettre l'enregistrement"}
            </button>
          )}
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <div className={styles.resultSection}>
          <h3 className={styles.resultTitle}>Résultat :</h3>
          <p><strong className={styles.boldText}>Score :</strong> {result.score}%</p>
          <p><strong className={styles.boldText}>Message :</strong></p>
          <p style={{ whiteSpace: "pre-line" }}>{result.message}</p>
          {result.corrections && result.corrections.length > 0 && (
            <div>
              <h4 className={styles.boldText}>Corrections :</h4>
              <ul className={styles.correctionsList}>
                {result.corrections.map((correction, index) => (
                  <li key={index} className={styles.correctionItem}>
                    <strong className={styles.boldText}>Contexte :</strong> {correction.context}<br />
                    <strong className={styles.boldText}>Message :</strong> {correction.message}<br />
                    {correction.replacements && (
                      <><strong>Suggestions :</strong> {correction.replacements.join(", ")}</>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

    // Étape 2: Envoyer les données de transcription (et autres détails de l'exercice) pour évaluation
    const evaluationPayload = {
      user: "big_boss",
      category,
      question,
      answer: transcriptionData.transcription, // Envoyer la transcription brute comme réponse texte principale si besoin
      transcription_data: transcriptionData // Inclure toutes les données de transcription
    };

    const evaluateRes = await fetch("http://localhost:8001/exercises/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evaluationPayload)
    });

    const evaluationResult = await evaluateRes.json();
    setResult(evaluationResult);

     // Optionnel: réinitialiser l'audio Blob après évaluation si vous ne voulez pas qu'il reste dans le lecteur
    // setAudioBlob(null);
  };

  return (
    <div className="flex flex-col items-center" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <h1 className="title" style={{ fontSize: "4em", marginBottom: "40px" }}>Exercices</h1>

      <div style={{ width: "100%", maxWidth: "1400px" }}>
        {/* Section de sélection */}
        <div className="flex flex-col gap-30" style={{ marginBottom: "40px" }}>
          <div className="flex flex-col gap-20">
            <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Catégorie</h2>
            <div className="flex flex-wrap gap-10">
              {Object.keys(exercises).map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange({ target: { value: cat } })}
                  className="action-button"
                  style={{ 
                    padding: "15px 30px",
                    fontSize: "1.2em",
                    backgroundColor: category === cat ? "var(--accent-color)" : "var(--primary-color)",
                    color: "white",
                    minWidth: "200px"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-20">
            <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Exercice</h2>
            <select 
              value={question} 
              onChange={handleQuestionChange}
              className="action-button"
              style={{ 
                width: "100%", 
                padding: "20px",
                fontSize: "1.4em",
                backgroundColor: "var(--primary-color)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              <option value="">Sélectionnez un exercice</option>
              {exercises[category]?.map((q, i) => (
                <option key={i} value={q}>
                  {q.replace(/^Corrige les erreurs de conjugaison dans la phrase suivante : /, "")}
                </option>
              ))}
            </select>
          </div>

          {/* Affichage de la phrase sélectionnée */}
          {question && (
            <div className="flex flex-col gap-20">
              <h2 className="subtitle" style={{ fontSize: "2em", marginBottom: "20px" }}>Phrase à corriger</h2>
              <div className="card" style={{ 
                padding: "30px", 
                width: "100%", 
                backgroundColor: "var(--background-color)",
                textAlign: "center"
              }}>
                <p style={{ 
                  fontSize: "1.8em", 
                  fontStyle: "italic", 
                  color: "var(--text-color)",
                  lineHeight: "1.4"
                }}>
                  {question.replace(/^Corrige les erreurs de conjugaison dans la phrase suivante : /, "")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section de réponse */}
        <div className="card" style={{ padding: "40px", marginBottom: "40px" }}>
          {category !== "Oral" ? (
            <form onSubmit={handleSubmitText}>
              <textarea
                rows={5}
                placeholder="Écrivez votre réponse ici..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "20px", 
                  fontSize: "1.3em",
                  backgroundColor: "var(--background-color)",
                  border: "none",
                  borderRadius: "8px",
                  minHeight: "200px",
                  marginBottom: "30px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="action-button"
                  style={{ 
                    padding: "15px 40px",
                    fontSize: "1.3em",
                    backgroundColor: "var(--accent-color)"
                  }}
                >
                  Envoyer
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-30">
              <div className="card" style={{ 
                padding: "30px", 
                width: "100%", 
                backgroundColor: "var(--background-color)",
                textAlign: "center"
              }}>
                <p style={{ fontSize: "1.8em", fontStyle: "italic", color: "var(--text-color)" }}>
                  {question.replace(/^Répète ce texte : /, "")}
                </p>
              </div>

              <button 
                onClick={handleRecord}
                className="action-button"
                style={{ 
                  padding: "20px 40px",
                  fontSize: "1.4em",
                  backgroundColor: recording ? "var(--accent-color)" : "var(--primary-color)",
                  minWidth: "300px"
                }}
              >
                {recording ? "⏹️ Arrêter l'enregistrement" : "🎙️ Commencer à enregistrer"}
              </button>

              {audioBlob && (
                <div className="flex flex-col items-center gap-20" style={{ width: "100%" }}>
                  <audio 
                    controls 
                    src={URL.createObjectURL(audioBlob)}
                    style={{ width: "100%", maxWidth: "600px" }}
                  />
                  <button 
                    onClick={handleSubmitAudio} 
                    disabled={!audioBlob}
                    className="action-button"
                    style={{ 
                      padding: "15px 40px",
                      fontSize: "1.3em",
                      backgroundColor: "var(--accent-color)",
                      opacity: audioBlob ? 1 : 0.5
                    }}
                  >
                    Envoyer l'audio pour évaluation
                  </button>
                </div>
              )}
            </div>
          )}
master
        </div>

        {/* Section des résultats */}
        {result && (
          <div className="card" style={{ padding: "40px" }}>
            <div className="flex flex-col items-center gap-30">
              <div className="flex items-center gap-20">
                <h2 className="subtitle" style={{ fontSize: "2em", margin: 0 }}>Résultat</h2>
                <div style={{ 
                  padding: "15px 30px",
                  backgroundColor: result.score > 75 ? "var(--success-color)" : 
                                result.score > 50 ? "var(--warning-color)" : 
                                "var(--danger-color)",
                  color: "white",
                  fontSize: "1.6em",
                  borderRadius: "8px"
                }}>
                  {result.score}/100
                </div>
              </div>

              <div className="card" style={{ 
                width: "100%", 
                padding: "30px",
                backgroundColor: "var(--background-color)"
              }}>
                <p style={{ fontSize: "1.3em", lineHeight: "1.6" }}>{result.message}</p>
              </div>

              {result.corrections && result.corrections.length > 0 && (
                <div style={{ width: "100%" }}>
                  <h3 className="subtitle" style={{ fontSize: "1.8em", marginBottom: "20px" }}>
                    Corrections suggérées
                  </h3>
                  <div className="flex flex-col gap-15">
                    {result.corrections.map((c, i) => (
                      <div key={i} className="card" style={{ 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <p style={{ fontSize: "1.2em", marginBottom: "10px" }}>
                          <strong>Erreur :</strong> "{c.context}"
                        </p>
                        <p style={{ fontSize: "1.2em", marginBottom: "10px", color: "var(--accent-color)" }}>
                          <i>{c.message}</i>
                        </p>
                        {c.replacements && c.replacements.length > 0 && (
                          <p style={{ fontSize: "1.2em" }}>
                            <strong>Suggestions :</strong> {c.replacements.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.transcription_data && (
                <div style={{ width: "100%" }}>
                  <h3 className="subtitle" style={{ fontSize: "1.8em", marginBottom: "20px" }}>
                    Analyse de votre parole
                  </h3>
                  <div className="flex flex-col gap-20">
                    <div className="card" style={{ 
                      padding: "20px",
                      backgroundColor: "var(--background-color)"
                    }}>
                      <p style={{ fontSize: "1.2em", marginBottom: "10px" }}>
                        <strong>Transcription brute :</strong> {result.transcription_data.transcription}
                      </p>
                      <p style={{ fontSize: "1.2em" }}>
                        <strong>Transcription corrigée :</strong> {result.transcription_data.corrected_transcription}
                      </p>
                    </div>

                    <div className="flex gap-20">
                      <div className="card" style={{ 
                        flex: 1, 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <strong style={{ fontSize: "1.2em" }}>Nombre de mots :</strong> {result.transcription_data.word_count}
                      </div>
                      <div className="card" style={{ 
                        flex: 1, 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <strong style={{ fontSize: "1.2em" }}>Vitesse de parole :</strong> {result.transcription_data.speech_rate} mots/min
                      </div>
                    </div>

                    {Object.keys(result.transcription_data.tic_counts).length > 0 && (
                      <div className="card" style={{ 
                        padding: "20px",
                        backgroundColor: "var(--background-color)"
                      }}>
                        <strong style={{ fontSize: "1.2em", marginBottom: "15px", display: "block" }}>
                          Tics de langage détectés
                        </strong>
                        <div className="flex flex-wrap gap-10">
                          {Object.entries(result.transcription_data.tic_counts).map(([tic, count]) => (
                            <div key={tic} className="card" style={{ 
                              padding: "10px 20px",
                              backgroundColor: "var(--primary-color)",
                              color: "white"
                            }}>
                              {tic}: {count}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 