import React, { useState } from 'react';
import './App.css';

function App() {
  const [dbStatus, setDbStatus] = useState('Disconnected');
  const [dataInput, setDataInput] = useState('');
  const [records, setRecords] = useState([
    { id: 1, text: 'Analyze YOLO datasets', time: '10:15 AM' },
    { id: 2, text: 'Initialize git repository', time: '11:34 AM' },
    { id: 3, text: 'Setup React & Firebase app', time: '11:40 AM' },
  ]);

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!dataInput.trim()) return;
    const newRecord = {
      id: Date.now(),
      text: dataInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setRecords([newRecord, ...records]);
    setDataInput('');
  };

  const connectFirebase = () => {
    setDbStatus('Connecting...');
    setTimeout(() => {
      setDbStatus('Connected (Mock)');
    }, 1200);
  };

  return (
    <div className="app-container">
      {/* Background glow effects */}
      <div className="glow-orb primary-glow"></div>
      <div className="glow-orb secondary-glow"></div>

      <header className="header">
        <div className="logo-container">
          <span className="logo-icon">▲</span>
          <h1 className="logo-text">KAIZEN<span className="accent">.</span></h1>
        </div>
        <div className="status-badge" onClick={connectFirebase}>
          <span className={`status-indicator ${dbStatus.toLowerCase().replace(/\s/g, '-')}`}></span>
          {dbStatus}
        </div>
      </header>

      <main className="main-content">
        <section className="hero-section">
          <h2 className="title-gradient">Continuous Improvement</h2>
          <p className="subtitle">Welcome to your premium React + Firebase workspace. Build, test, and iterate with speed and precision.</p>
        </section>

        <div className="dashboard-grid">
          <div className="card glass-card">
            <h3>Firebase Operations</h3>
            <p className="card-desc">Configure and test database synchronization in real-time.</p>
            
            <form onSubmit={handleAddRecord} className="form-group">
              <input
                type="text"
                placeholder="Enter workspace task..."
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                className="custom-input"
              />
              <button type="submit" className="custom-button primary">
                Add Record
              </button>
            </form>

            <button onClick={connectFirebase} className="custom-button secondary">
              Test Connection
            </button>
          </div>

          <div className="card glass-card">
            <h3>Activity Log</h3>
            <p className="card-desc">Recent events stored in the current session.</p>
            <div className="records-list">
              {records.map((record) => (
                <div key={record.id} className="record-item">
                  <span className="record-text">{record.text}</span>
                  <span className="record-time">{record.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 Kaizen Hack. Optimized with Antigravity AI.</p>
      </footer>
    </div>
  );
}

export default App;
