

export default function Home() {
  return (
    <div style={{ padding: "2rem", fontSize: "1.5rem" }}>
      Welcome to Cardland Admin Panel
    </div>
  );
}

import React from 'react';

export default function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Cardland Admin Panel</h1>
      <nav>
        <ul>
          <li>🏠 Dashboard</li>
          <li>📦 Manage Cards</li>
          <li>👤 Users</li>
          <li>⚙️ Settings</li>
        </ul>
      </nav>
      <main>
        <p>Welcome, admin! Choose an option from the menu.</p>
      </main>
    </div>
  );
}
