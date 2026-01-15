import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="container docs-page" aria-labelledby="training-heading">
    <h1 id="training-heading">Training — Using GitHub Copilot</h1>
    <p class="form-desc">Short videos and docs to help contributors use GitHub Copilot to safely and productively make changes to this repository.</p>

    <h2>VS Code (recommended for frontend)</h2>
    <ul>
      <li *ngFor="let v of vscodeResources" class="training-item">
        <div class="training-thumb">
          <svg width="64" height="36" viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0" stop-color="#e6f7ff" />
                <stop offset="1" stop-color="#dff6ff" />
              </linearGradient>
            </defs>
            <rect width="64" height="36" rx="6" fill="url(#g1)" />
            <polygon points="24,9 48,18 24,27" fill="#0fb2e3" />
          </svg>
        </div>
        <div class="training-meta">
          <a [href]="v.url" target="_blank" rel="noopener">{{ v.title }}</a>
          <p class="training-desc">{{ v.desc }}</p>
        </div>
      </li>
    </ul>

    <h2>Visual Studio (recommended for backend/.NET)</h2>
    <ul>
      <li *ngFor="let v of vsResources" class="training-item">
        <div class="training-thumb">
          <svg width="64" height="36" viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="g2" x1="0" x2="1">
                <stop offset="0" stop-color="#fff4e6" />
                <stop offset="1" stop-color="#fff2df" />
              </linearGradient>
            </defs>
            <rect width="64" height="36" rx="6" fill="url(#g2)" />
            <polygon points="24,9 48,18 24,27" fill="#f58023" />
          </svg>
        </div>
        <div class="training-meta">
          <a [href]="v.url" target="_blank" rel="noopener">{{ v.title }}</a>
          <p class="training-desc">{{ v.desc }}</p>
        </div>
      </li>
    </ul>

    <h2>Guidance</h2>
    <ul>
      <li>Always review suggestions from Copilot — do not accept code without understanding it.</li>
      <li>Create a small feature branch and run tests locally before opening a pull request.</li>
      <li>Prefer explicit, minimal changes and add/update unit or e2e tests when behavior changes.</li>
    </ul>

    <h2>Setup: Installing GitHub Copilot</h2>
    <section>
      <h3>VS Code</h3>
      <ol>
        <li>Open VS Code and go to the <strong>Extensions</strong> view (<kbd>Ctrl+Shift+X</kbd> / <kbd>Cmd+Shift+X</kbd>).</li>
        <li>Search for <strong>GitHub Copilot</strong> and install the official extension by GitHub.</li>
        <li>Sign in with your GitHub account when prompted (choose the account with Copilot access or trial).</li>
        <li>Enable Copilot suggestions in settings: open <strong>Settings</strong> and search for <em>Copilot</em> to toggle inline suggestions and editor behavior.</li>
        <li>Use the suggestion shortcuts: <kbd>Tab</kbd> to accept, <kbd>Esc</kbd> to dismiss, and <kbd>Alt+[</kbd>/<kbd>Alt+]</kbd> (or the inline UI) to cycle suggestions.</li>
        <li>When editing this repo: work in a feature branch, run unit and e2e tests locally, and use small commits to keep suggestions reviewable.</li>
      </ol>

      <h3>Visual Studio</h3>
      <ol>
        <li>Open Visual Studio and navigate to <strong>Extensions &gt; Manage Extensions</strong>.</li>
        <li>Search for <strong>GitHub Copilot</strong> and install the extension for Visual Studio (you may need to restart the IDE).</li>
        <li>Sign in with your GitHub account when prompted and grant Copilot access.</li>
        <li>Enable inline suggestions in the Copilot extension settings and configure any behavioral preferences (e.g., suggestion frequency).</li>
        <li>Use the provided shortcuts or the inline completion UI to accept/dismiss suggestions; review all generated code carefully before committing.</li>
        <li>Prefer using Copilot for small refactors or generating tests and then running the solution tests before pushing changes.</li>
      </ol>
    </section>
  </section>
  `
})
export class TrainingComponent {
  vscodeResources = [
    {
      title: 'Getting started with Copilot in VS Code — Quick start',
      url: 'https://docs.github.com/en/copilot/getting-started-with-github-copilot-in-visual-studio-code',
      desc: 'Official GitHub documentation covering installation, basic editing workflows and tips for accepting suggestions in VS Code.'
    },
    {
      title: 'GitHub Copilot overview and guidance',
      url: 'https://docs.github.com/en/copilot',
      desc: 'High-level guidance, recommended practices and links to deeper topics useful for frontend developers.'
    },
    {
      title: 'Official GitHub Copilot videos (YouTube channel)',
      url: 'https://www.youtube.com/@GitHub/videos',
      desc: 'Browse short demos and walkthroughs from the official GitHub channel — good for quick visual learning.'
    }
  ];

  vsResources = [
    {
      title: 'Getting started with Copilot in Visual Studio — Quick start',
      url: 'https://docs.github.com/en/copilot/getting-started-with-github-copilot-in-visual-studio',
      desc: 'Step-by-step instructions for enabling Copilot in Visual Studio and using it to edit C# and .NET projects.'
    },
    {
      title: 'GitHub Copilot for Visual Studio (Microsoft Learn)',
      url: 'https://learn.microsoft.com/en-us/visualstudio/ide/github-copilot',
      desc: 'Microsoft Learn guidance and best practices for Visual Studio users integrating Copilot into development flows.'
    },
    {
      title: 'Visual Studio channel — Copilot demos & walkthroughs',
      url: 'https://www.youtube.com/@VisualStudio/videos',
      desc: 'Practical demos showing Copilot in real-world .NET scenarios, useful for backend changes and migrations.'
    }
  ];

  getThumb(url: string): string {
    try {
      const u = new URL(url);
      // YouTube watch links and youtu.be share links
      if (u.hostname.includes('youtube.com')) {
        const vid = u.searchParams.get('v');
        if (vid) return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      }
      if (u.hostname === 'youtu.be') {
        const vid = u.pathname.slice(1);
        if (vid) return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
      }
    } catch { /* ignore */ }
    // fallback placeholder
    return 'https://via.placeholder.com/160x90.png?text=Video';
  }
}
