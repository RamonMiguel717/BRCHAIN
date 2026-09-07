import Image from "next/image";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import { LinkButton } from "@/components/Button/Button";
import { ContactProvider } from "@/components/contact/ContactProvider";
import { ContactButton } from "@/components/contact/ContactButton";
import { CareLoop } from "@/components/careLoop/careLoop";
import { LandingNewsPreview } from "@/components/news/LandingNewsPreview";
import { AgentsCarousel } from "@/components/agentsCarousel/agentsCarousel";
import { GovernanceCarousel } from "@/components/governanceCarousel/governanceCarousel";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <ContactProvider>
      <Header />
      <main className={styles.main}>
        {/* ---------------- Hero ---------------- */}
        <section className={styles.hero}>
          <div className={styles.heroWrapper}>
            <div className={styles.heroContent}>
              <span className={styles.tag}>Health Intelligence Layer</span>
              <h1>
                O Sistema Nervoso <span>Digital da Saúde.</span>
              </h1>
              <p>
                O hospital do futuro não será construído apenas pelo departamento de TI. A BRCHAIN
                é a camada de inteligência que conecta governança, operação e a jornada do paciente
                em uma única visão estratégica.
              </p>
              <div className={styles.buttons}>
                <ContactButton variant="primary">Agendar Reunião Estratégica</ContactButton>
                <LinkButton href="#governanca" variant="outline">
                  Entender a Arquitetura
                </LinkButton>
              </div>
            </div>
            <div className={styles.heroVisuals} aria-hidden="true">
              <div className={styles.mockupContainer}>
                <div className={`${styles.mockup} ${styles.mockupLeft}`}>
                  <Image src="/images/PERFIL.png" alt="" width={200} height={430} />
                </div>
                <div className={`${styles.mockup} ${styles.mockupCenter}`}>
                  <Image src="/images/DASHBOARD.png" alt="" width={240} height={520} />
                </div>
                <div className={`${styles.mockup} ${styles.mockupRight}`}>
                  <Image src="/images/DETALHES_CONSULTA.png" alt="" width={200} height={430} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Governança ---------------- */}
        <section id="governanca" className={styles.problem}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Governança de Nível Executivo: Segurança que Transcende a Conformidade</h2>
              <p>
                Em um ecossistema crítico como o da saúde, tratar a privacidade como um mero
                checklist jurídico é um risco incalculável. Na BRChain, elevamos a proteção e a
                gestão da informação à categoria de infraestrutura crítica, com ética, privacidade
                e segurança nativas.
              </p>
            </div>

            <h3 className={styles.subTitle}>Nossos Pilares de Governança e Conformidade</h3>
            <GovernanceCarousel>
              <div className={styles.visionCard}>
                <h3>Arquitetura Fundamentada no</h3>

                <p className={styles.highlight}>
                  DAMA-DMBOK e COBIT 2019
                </p>

                <p>
                  Gestão de metadados, linhagem de dados e padronização para transformar dados
                  brutos em ativos estratégicos, confiáveis e interoperáveis.
                </p>
              </div>

              <div className={styles.visionCard}>
                <h3>Alinhamento Estrito com a</h3>

                <p className={styles.highlight}>
                  LGPD e Diretrizes da ANPD
                </p>

                <p>
                  Privacidade como núcleo (Privacy by Design e by Default). Atendimento rigoroso ao
                  exigido pela Autoridade Nacional de Proteção de Dados.
                </p>
              </div>

              <div className={styles.visionCard}>
                <h3>O Imperativo da Ética na</h3>

                <p className={styles.highlight}>
                  Gestão da Saúde
                </p>

                <p>
                  Proteção absoluta da identidade. O dado é rigorosamente anonimizado sem comprometer
                  o valor analítico para pesquisa e inovação.
                </p>
              </div>
            </GovernanceCarousel>

            <div className={styles.center}>
              <ContactButton variant="primary">
                Avaliação de governança de dados
              </ContactButton>
            </div>
          </div>
        </section>

        {/* ---------------- Pesquisa e DaaS ---------------- */}
        <section id="pesquisa" className={styles.layer}>
          <div className="container">
            <span className={styles.tag}>Deeptech em Saúde</span>
            <div className={styles.sectionHeader}>
              <h2>Data-as-a-Service e Ambientes de Pesquisa</h2>
              <p>
                Eliminamos as barreiras entre a informação e a descoberta. Fornecemos infraestrutura
                avançada para que universidades, institutos de pesquisa e centros de inovação
                transformem dados brutos em inteligência científica.
              </p>
            </div>

            <div className={styles.layerBox}>
              <h3>Ecossistema de Pesquisa BRChain</h3>
              <div className={styles.loopGrid}>
                <div className={styles.loopStep}>
                  <h4>Ambientes Sandbox Isolados e Seguros</h4>
                  <p>
                    Treine modelos de IA e valide algoritmos com conjuntos anonimizados ou dados
                    sintéticos. Valor científico sem risco de reidentificação.
                  </p>
                </div>
                <div className={styles.loopStep}>
                  <h4>Data-as-a-Service (DaaS) de Alta Qualidade</h4>
                  <p>
                    Acesso sob demanda a conjuntos de dados de saúde higienizados e padronizados sob
                    rigorosos frameworks de governança.
                  </p>
                </div>
                <div className={styles.loopStep}>
                  <h4>Potencializando a Produção Científica</h4>
                  <p>
                    Rastreamento de metadados complexos para estudos epidemiológicos, análises
                    bibliométricas e publicação de alto impacto.
                  </p>
                </div>
                <div className={styles.loopStep}>
                  <h4>Liberdade Científica com Rigor Ético</h4>
                  <p>
                    O ciclo de uso secundário dos dados respeita a dignidade e o consentimento do
                    titular. O humano é o fim, nunca um meio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- BRChain News (integração) ---------------- */}
        <CareLoop />

        {/* ---------------- Soluções Corporativas ---------------- */}
        <section id="solucoes" className={styles.solucoes}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Soluções Corporativas e Integração via APIs</h2>
              <p>
                A BRChain atua como o motor invisível e seguro da sua operação, uma suíte de
                soluções B2B e APIs robustas que injetam governança avançada, rastreabilidade e
                conformidade regulatória.
              </p>
            </div>

            <AgentsCarousel>
              <div className={styles.agentCard}>
                <h4>API as a Service: Criptografia e Consentimento</h4>
                <p>
                  Integre o núcleo tecnológico da BRChain aos seus sistemas (HIS/LIS) e gerencie o
                  consentimento do paciente em tempo real.
                </p>
              </div>

              <div className={styles.agentCard}>
                <h4>Engenharia de Dados para o Futuro Analítico</h4>
                <p>
                  Extraímos e estruturamos dados presos em silos, preparando o terreno para Data
                  Lakes corporativos e IA.
                </p>
              </div>

              <div className={styles.agentCard}>
                <h4>Licenciamento de Propriedade Intelectual</h4>
                <p>
                  Licenciamos algoritmos proprietários para consórcios e redes acelerarem sua
                  maturidade digital com arquitetura validada.
                </p>
              </div>

              <div className={styles.agentCard}>
                <h4>Escalabilidade Inteligente e Validação</h4>
                <p>
                  Modelos de integração adaptáveis, pay-per-use, assinaturas ou licenciamento, com
                  investimento escalável e previsível.
                </p>
              </div>
            </AgentsCarousel>

            <div className={styles.center} style={{ marginTop: 40 }}>
              <ContactButton variant="primary">Fale com Nossos Especialistas</ContactButton>
            </div>
          </div>
        </section>

        {/* ---------------- BRChain News (integração) ---------------- */}
        <LandingNewsPreview />

        {/* ---------------- CTA final ---------------- */}
        <section id="contato" className={styles.cta}>
          <div className="container">
            <h2>Pronto para liderar a saúde do futuro?</h2>
            <p>
              Descubra como o BRCHAIN pode ser o sistema nervoso digital da sua instituição, unindo
              tecnologia, estratégia e cuidado.
            </p>
            <ContactButton variant="white">Falar com Especialistas BRCHAIN</ContactButton>
          </div>
        </section>
      </main>
      <Footer />
    </ContactProvider>
  );
}
