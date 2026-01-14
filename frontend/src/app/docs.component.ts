import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="docs-page">
    <h1>Getting Started — FleetHub</h1>
    <p>Five quick steps to run and use this application:</p>
    <ol>
      <li><strong>Install prerequisites:</strong> .NET SDK 8+ and Node.js 18+ (npm).</li>
      <li><strong>Start the backend:</strong> open a terminal in the <em>backend</em> folder, run <code>dotnet restore</code>, <code>dotnet build</code>, then <code>dotnet run</code> (Development uses a local SQLite fallback). The API listens on <code>http://localhost:5000</code> by default.</li>
      <li><strong>Start the frontend:</strong> open a terminal in the <em>frontend</em> folder, run <code>npm install</code> then <code>npm.cmd start</code> (or <code>npm start</code> if your shell supports it). Open <code>http://127.0.0.1:4200</code>.</li>
      <li><strong>Configure a database (optional):</strong> set the <code>FLEET_CONNECTION_STRING</code> environment variable to point at a SQL Server instance if you prefer a persistent DB; the app will connect without running migrations automatically.</li>
      <li><strong>Use the app:</strong> create and view appointments from the frontend, or call the API (e.g. <code>GET /api/ServiceAppointments</code>). If you change the backend host/port, update <code>frontend/src/app/fleet.service.ts</code> <code>API_BASE</code> constant.</li>
    </ol>
    <p>See the repository <strong>README.md</strong> for more detailed troubleshooting and configuration notes.</p>
  </section>
  `
})
export class DocsComponent {}
