// © 2025 William Rodrigues da Silva
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServicosApiService, Servico } from '../../../core/services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [],
  template: `
    <section class="hero">
      <div class="hero__bg">
        <div class="hero__orb h1"></div>
        <div class="hero__orb h2"></div>
      </div>
      <div class="container hero__grid">
        <div class="hero__content fade-in-up">
          <p class="section-overline">Biomedicina Estética · São Paulo</p>
          <h1 class="hero__title">A arte de revelar<br/><em>sua melhor versão</em></h1>
          <p class="hero__desc">Protocolos exclusivos com tecnologia de ponta e a delicadeza que você merece. Resultados naturais — com segurança e elegância.</p>
          <div class="hero__actions">
            <a routerLink="/auth/registrar" class="btn btn--primary btn--lg">Agendar Avaliação Gratuita</a>
            <a routerLink="/servicos" class="btn btn--outline btn--lg" style="border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)">Ver Tratamentos</a>
          </div>
          <div class="hero__stats">
            @for (s of stats; track s.label) {
              <div class="hstat"><span class="hstat__n">{{ s.num }}</span><span class="hstat__l">{{ s.label }}</span></div>
              @if (!$last) { <div class="hstat__div"></div> }
            }
          </div>
        </div>
        <div class="hero__visual">
          <div class="hero__img-box">
            <div class="hero__img-ph"><div class="ph-ring"></div><span class="ph-icon">✦</span></div>
            <div class="hero__badge"><span class="hb-star">★</span><div><strong>Nota 5.0</strong><span>Google Reviews</span></div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="home-sobre">
      <div class="container">
        <div class="hs-grid">
          <div class="hs-visual">
            <div class="hs-img"></div>
            <div class="hs-quote">
              <p>"Beleza é ciência<br/>e arte em equilíbrio."</p>
              <span>— Dra. Vania Herculano</span>
            </div>
          </div>
          <div class="hs-text">
            <p class="section-overline">Nossa Filosofia</p>
            <h2 class="section-title">Onde ciência encontra <em>sofisticação</em></h2>
            <p style="margin-bottom:.9rem">Na Vania Herculano Biomedicina Estética, cada protocolo é desenvolvido individualmente, respeitando a singularidade de cada cliente.</p>
            <p>Combinamos as tecnologias mais avançadas com a sensibilidade de uma equipe altamente especializada para resultados naturais e duradouros.</p>
            <div class="hs-items">
              @for (i of diferenciais; track i.titulo) {
                <div class="hs-item">
                  <span class="hs-icon">{{ i.icon }}</span>
                  <div><strong>{{ i.titulo }}</strong><p>{{ i.desc }}</p></div>
                </div>
              }
            </div>
            <a routerLink="/sobre" class="btn btn--outline" style="margin-top:1.8rem">Conhecer a Clínica</a>
          </div>
        </div>
      </div>
    </section>

    <section class="home-servicos">
      <div class="container">
        <div class="srv-head">
          <div>
            <p class="section-overline">Procedimentos</p>
            <h2 class="section-title">Tratamentos <em>exclusivos</em></h2>
          </div>
          <a routerLink="/servicos" class="btn btn--ghost btn--sm">Ver todos →</a>
        </div>
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
        } @else {
          <div class="srv-grid">
            @for (s of servicos().slice(0,6); track s.id; let i = $index) {
              <div class="srv-card">
                <div class="srv-card__num">{{ (i+1).toString().padStart(2,"0") }}</div>
                <div class="srv-card__cat">{{ s.categoria }}</div>
                <h3>{{ s.nome }}</h3>
                <p>{{ s.descricao }}</p>
                <div class="srv-card__footer">
                  <span>⏱ {{ s.duracao_min }}min</span>
                  <strong>R$ {{ s.valor | number:"1.0-0" }}</strong>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <section class="home-dep">
      <div class="container">
        <p class="section-overline center">Depoimentos</p>
        <h2 class="section-title" style="text-align:center;margin-bottom:3rem">O que nossas clientes <em>dizem</em></h2>
        <div class="dep-grid">
          @for (d of depoimentos; track d.nome) {
            <div class="dep-card" [class.featured]="d.featured">
              <div class="dep-stars">★★★★★</div>
              <p>"{{ d.texto }}"</p>
              <div class="dep-author">
                <div class="dep-av">{{ d.nome[0] }}</div>
                <div><strong>{{ d.nome }}</strong><span>{{ d.info }}</span></div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="home-cta">
      <div class="container" style="text-align:center">
        <p class="section-overline center">Primeiro Passo</p>
        <h2 class="section-title light">Pronta para a sua <em style="color:var(--gold-light)">transformação</em>?</h2>
        <p style="color:rgba(255,255,255,.45);margin:.8rem auto 2rem;max-width:480px">Agende sua avaliação gratuita. Sem compromisso — um momento dedicado a você.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
          <a routerLink="/auth/registrar" class="btn btn--primary btn--lg">Agendar Agora</a>
          <a routerLink="/contato" class="btn btn--outline btn--lg" style="border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.75)">Falar Conosco</a>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  private srvApi = inject(ServicosApiService);
  servicos = signal<Servico[]>([]);
  loading  = signal(true);
  stats = [
    { num:"10+", label:"Anos de Excelência" },
    { num:"3.500+", label:"Clientes Atendidas" },
    { num:"98%", label:"Satisfação" },
  ];
  diferenciais = [
    { icon:"◈", titulo:"Diagnóstico Personalizado", desc:"Análise completa antes de qualquer procedimento" },
    { icon:"◈", titulo:"Tecnologia Premium", desc:"Equipamentos certificados ANVISA de última geração" },
    { icon:"◈", titulo:"Sigilo & Privacidade", desc:"Ambiente exclusivo e totalmente reservado" },
  ];
  depoimentos = [
    { nome:"Ana Claudia M.", info:"Cliente desde 2021", featured:false, texto:"A experiência na Vania Herculano é completamente diferente. O resultado ficou absolutamente natural. Me sinto 10 anos mais jovem." },
    { nome:"Patrícia Souza",  info:"Cliente desde 2020", featured:true,  texto:"Me surpreendi com o nível de atenção e personalização. Cada detalhe foi pensado para mim. Um cuidado raro e sofisticado." },
    { nome:"Fernanda Alves",  info:"Cliente desde 2022", featured:false, texto:"Profissionalismo absoluto, ambiente acolhedor e resultados impecáveis. Finalmente encontrei o lugar certo." },
  ];
  ngOnInit() {
    this.srvApi.listar({ ativo: true }).subscribe({
      next: r => { this.servicos.set(r.dados); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
