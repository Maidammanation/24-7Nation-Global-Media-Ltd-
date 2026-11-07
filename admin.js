const menuButton = document.getElementById('mobileMenu');
const sidebar = document.getElementById('sidebar');
if (menuButton && sidebar) menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));

const pageTitle = document.getElementById('pageTitle');
const crumbName = document.getElementById('crumbName');
const panel = document.getElementById('viewPanel');
const navItems = document.querySelectorAll('.nav-item');
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const views = {
  overview: {title:'CEO Control Centre',crumb:'OVERVIEW'},
  newsroom: {title:'Newsroom',crumb:'NEWSROOM',description:'Create, review and publish approved news stories, features, announcements and corrections.',items:['Story drafts and editorial review','Publication calendar and categories','Corrections, source notes and approval history']},
  artists: {title:'Artists & Music',crumb:'ARTISTS & MUSIC',description:'Maintain verified artist profiles, releases, promotional materials and music rights information.',items:['Artist profiles and team assignments','Release metadata and streaming links','Contracts, permissions and release approvals']},
  productions: {title:'Maidammanation Productions',crumb:'PRODUCTIONS',description:'Coordinate the production arm within 24/7 Nation Global Media.',items:['Projects, shoots and production schedules','Interviews, podcasts, documentaries and live coverage','Crew assignments, assets and production approvals']},
  team: {title:'Team & Roles',crumb:'TEAM & ROLES',description:'Invite staff and assign only the access each role needs. The owner retains the highest authority.',items:['Owner, super-admin and departmental roles','Role permissions and account status','Activity history and access reviews']},
  members: {title:'Community Members',crumb:'MEMBERS',description:'Manage membership applications, approved profiles, announcements and community programmes.',items:['Member applications and verification','Member directory and communication preferences','Community programmes and safeguarding workflows']},
  library: {title:'Media Library',crumb:'MEDIA LIBRARY',description:'Keep approved photos, video, audio, artwork and documents organised with clear rights information.',items:['Searchable media folders and metadata','Usage permissions, credits and expiry dates','Secure upload and access controls']},
  ai: {title:'24/7 Nation AI Studio',crumb:'AI STUDIO',description:'Use AI to assist staff with research, drafting, planning and approved content organisation.',items:['Newsroom and creative drafting assistant','Source checking prompts and human approval queue','Media tagging and administrative summaries']},
  connect: {title:'24/7 Nation Connect',crumb:'NATION CONNECT',description:'A planned secure communication service for members, artists and authorised teams.',items:['Private and group messaging','Voice notes and notification delivery','Voice/video calls after real-time infrastructure is secured']},
  reports: {title:'Reports & Analytics',crumb:'REPORTS',description:'Review operational performance using verified data and clearly defined reporting periods.',items:['Website and content performance','Membership and programme reports','Export controls and audit history']},
  settings: {title:'Organisation Settings',crumb:'SETTINGS',description:'Configure organisation details, platform preferences, security and connected services.',items:['Brand, contact and public website settings','Authentication and security policies','Integrations, data retention and privacy controls']}
};

function showView(key) {
  const view = views[key] || views.overview;
  navItems.forEach(button => button.classList.toggle('active', button.dataset.view === key));
  pageTitle.textContent = view.title;
  crumbName.textContent = view.crumb;
  if (key === 'overview') {
    location.reload();
    return;
  }
  panel.innerHTML = '<div class="section-title"><div><span class="eyebrow">MANAGEMENT MODULE</span><h3>' + view.title + '</h3></div><span class="muted small">Backend connection required</span></div><div class="view-placeholder"><span class="eyebrow">PLANNED WORKSPACE</span><h3>' + view.title + '</h3><p>' + view.description + '</p><ul>' + view.items.map(item => '<li>' + item + '</li>').join('') + '</ul><span class="coming">NOT CONNECTED — SETUP PREVIEW</span></div>';
  if (sidebar) sidebar.classList.remove('open');
}
navItems.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
