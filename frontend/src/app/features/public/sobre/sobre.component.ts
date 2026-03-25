// © 2025 William Rodrigues da Silva
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-sobre', standalone: true, imports: [CommonModule, RouterLink], styles: [],
  template: `
    <div class="sobre-page">
      <div class="page-hero"><div class="container">
        <p class="section-overline center">A Clínica</p>
        <h1>Nossa <em>História</em></h1>
      </div></div>
      <section class="s-missao"><div class="container">
        <div class="missao-grid">
          <div><div class="missao-img"><span style="font-size:5rem;color:rgba(200,151,58,.15)">✦</span></div></div>
          <div class="missao-text">
            <p class="section-overline">Quem Somos</p>
            <h2 class="section-title">Excelência em <em>Estética Avançada</em></h2>
            <p>A Vania Herculano Biomedicina Estética nasceu da paixão por transformar vidas através da beleza e do bem-estar. Com mais de 10 anos de experiência, nos consolidamos como referência em tratamentos estéticos de alto padrão.</p>
            <p style="margin-top:.9rem">Nossa equipe é formada por profissionais especializados e em constante atualização, utilizando equipamentos de última geração e protocolos exclusivos para garantir os melhores resultados.</p>
            <p style="margin-top:.9rem">Cada cliente é única, e por isso oferecemos tratamentos personalizados em um ambiente acolhedor e sofisticado.</p>
          </div>
        </div>
      </div></section>
      <section class="s-valores"><div class="container">
        <p class="section-overline center">Nossos Valores</p>
        <h2 class="section-title" style="text-align:center">O que nos <em>move</em></h2>
        <div class="valores-grid">
          @for (v of valores; track v.titulo) {
            <div class="valor-card"><span class="valor-icon">{{ v.icon }}</span><h3>{{ v.titulo }}</h3><p>{{ v.desc }}</p></div>
          }
        </div>
      </div></section>
      <section class="s-equipe"><div class="container">
        <p class="section-overline center">Equipe</p>
        <h2 class="section-title" style="text-align:center">Especialistas em <em>alta estética</em></h2>
        <div class="equipe-grid">
          @for (m of equipe; track m.nome) {
            <div class="membro-card">
              <div class="membro-foto">✦</div>
              <div class="membro-info">
                <h3>{{ m.nome }}</h3>
                <span class="cargo">{{ m.cargo }}</span>
                <p>{{ m.bio }}</p>
                <div class="membro-tags">@for (t of m.tags; track t) { <span>{{ t }}</span> }</div>
              </div>
            </div>
          }
        </div>
      </div></section>
      <section class="s-cta"><div class="container" style="text-align:center">
        <h2 class="section-title light">Agende sua <em style="color:var(--gold-light)">avaliação gratuita</em></h2>
        <p style="color:rgba(255,255,255,.45);margin:.8rem auto 2rem;max-width:460px">Sem compromisso — apenas um momento dedicado a você.</p>
        <a routerLink="/auth/registrar" class="btn btn--primary btn--lg">Agendar Agora</a>
      </div></section>
    </div>
  `
})
export class SobreComponent {
  valores = [
    { icon:"🔬", titulo:"Ciência", desc:"Baseamos cada decisão em evidências e pesquisa de ponta." },
    { icon:"✦", titulo:"Excelência", desc:"Perseguimos o resultado perfeito em cada detalhe." },
    { icon:"🤝", titulo:"Ética", desc:"Transparência e respeito como base de toda relação." },
    { icon:"🌿", titulo:"Naturalidade", desc:"Resultados que realçam a beleza única de cada pessoa." },
    { icon:"🔒", titulo:"Privacidade", desc:"Sigilo absoluto em ambiente exclusivo e acolhedor." },
    { icon:"💎", titulo:"Inovação", desc:"Sempre à frente com as mais novas tecnologias." },
  ];
  equipe = [
    { nome:"Dra. Vania Herculano", cargo:"Fundadora & Biomédica Esteta", bio:"Especialista em Biomedicina Estética com formação nacional e internacional.", tags:["Toxina Botulínica","Preenchimentos","Bioestimuladores"] },
    { nome:"Dr. Rafael Campos", cargo:"Médico Esteticista · CRM 112.890", bio:"Especialista em laser e procedimentos corporais. Fellowship em Nova York e Londres.", tags:["Laser CO₂","Fios PDO","Skinbooster"] },
    { nome:"Dra. Carolina Vaz", cargo:"Dermatologista · CRM 87.334", bio:"Mestre em Dermatologia pela USP. Membro da Sociedade Brasileira de Dermatologia.", tags:["Dermatologia Clínica","Peelings","Fotoproteção"] },
  ];
}
