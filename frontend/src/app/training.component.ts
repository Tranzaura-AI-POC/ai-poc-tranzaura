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

    <h2>Prompt engineering</h2>
    <ul>
      <li *ngFor="let p of promptResources" class="training-item">
        <div class="training-thumb">
          <svg width="64" height="36" viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="g3" x1="0" x2="1">
                <stop offset="0" stop-color="#f0f7e6" />
                <stop offset="1" stop-color="#eefbe8" />
              </linearGradient>
            </defs>
            <rect width="64" height="36" rx="6" fill="url(#g3)" />
            <polygon points="24,9 48,18 24,27" fill="#39cefa" />
          </svg>
        </div>
        <div class="training-meta">
          <a [href]="p.url" target="_blank" rel="noopener">{{ p.title }}</a>
          <p class="training-desc">{{ p.desc }}</p>
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
      title: 'GitHub Copilot for VS Code — Overview',
      url: 'https://code.visualstudio.com/docs/copilot/overview#:~:text=GitHub%20Copilot%20is%20an%20AI,based%20on%20your%20current%20context.',
      desc: 'Official VS Code docs providing an overview of GitHub Copilot, what it does, and how it integrates into the editor.'
    },
    {
      title: 'Copilot for VS Code — Features reference',
      url: 'https://code.visualstudio.com/docs/copilot/reference/copilot-vscode-features',
      desc: 'Detailed feature reference for Copilot in VS Code: inline completions, chat, settings and usage patterns.'
    },
    {
      title: 'Microsoft Learn: Copilot learning path',
      url: 'https://learn.microsoft.com/en-us/training/paths/copilot/',
      desc: 'A guided Microsoft Learn path with modules and hands-on exercises to learn Copilot concepts and workflows.'
    }
  ];

  promptResources = [
    {
      title: 'Prompt engineering — GitHub Copilot',
      url: 'https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering',
      desc: 'Best practices and guidance for writing prompts to get effective and safe suggestions from Copilot.'
    }
  ];

  vsResources = [
    {
      title: 'Visual Studio — GitHub Copilot: Install and states',
      url: 'https://learn.microsoft.com/en-us/visualstudio/ide/visual-studio-github-copilot-install-and-states?view=visualstudio',
      desc: 'Installation, licensing and supported states for GitHub Copilot in Visual Studio; troubleshooting and requirements.'
    },
    {
      title: 'Visual Studio — GitHub Copilot Chat',
      url: 'https://learn.microsoft.com/en-us/visualstudio/ide/visual-studio-github-copilot-chat?view=visualstudio',
      desc: 'Guide to using Copilot Chat inside Visual Studio: commands, workflows and examples for developer productivity.'
    },
    {
      title: 'Visual Studio — Copilot video playlist',
      url: 'https://www.youtube.com/playlist?list=PLReL099Y5nRckZDdcQ21UigO9pKa14yxC',
      desc: 'YouTube playlist of Visual Studio videos showcasing GitHub Copilot usage, demos and walkthroughs.'
    }
  ];

  getThumb(url: string): string {
    try {
      const u = new URL(url);
      // YouTube watch links and youtu.be share links
      if (u.hostname.includes('youtube.com')) {
        const vid = u.searchParams.get('v');
        if (vid) return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
        const list = u.searchParams.get('list');
        if (list) return `https://via.placeholder.com/160x90.png?text=YouTube+Playlist`;
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
