import Image from "next/image";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import { LinkButton } from "@/components/Button/Button";
import { ContactProvider } from "@/components/contact/ContactProvider";
import { ContactButton } from "@/components/contact/ContactButton";
// import { CareLoop } from "@/components/careLoop/careLoop";
import { LandingNewsPreview } from "@/components/news/LandingNewsPreview";
import { AgentsCarousel } from "@/components/agentsCarousel/agentsCarousel";
import { GovernanceCarousel } from "@/components/governanceCarousel/governanceCarousel";
import { FeaturesCarousel } from "@/components/featuresCarousel/featuresCarousel";
import styles from "./page.module.css";

// A seção de notícias (LandingNewsPreview) lê do banco: revalida
// periodicamente em vez de congelar o conteúdo no momento do build.
export const revalidate = 300;

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
                O Sistema Nervoso <br/> <span>Digital da Saúde.</span>
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

            <h3 className={styles.subTitle}>Recursos Nativos da Plataforma</h3>
            <FeaturesCarousel>
              <div className={styles.visionCard}>
                <p className={styles.highlight}>
                  Gestão Dinâmica de Consentimento
                </p>

                <p>
                  Concessão, revogação e auditoria granular de permissões, registradas de forma imutável.
                </p>
              </div>

              <div className={styles.visionCard}>
                <p className={styles.highlight}>
                  Master Data Management (MDM)
                </p>

                <p>
                  Centralização e higienização de dados mestres de pacientes, eliminando redundâncias e silos.
                </p>
              </div>

              <div className={styles.visionCard}>

                <p className={styles.highlight}>
                  Trilha de Auditoria Contínua
                </p>

                <p>
                  Rastreabilidade de ponta a ponta. Saiba quem, quando e por que cada registro foi acessado.
                </p>
              </div>
            </FeaturesCarousel>

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
                    Treine modelos de IA e valide algoritmos utilizando conjuntos rigorosamente anonimizados ou dados sintéticos. Extraia valor científico sem risco de reidentificação.
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

              <div className={styles.center}>
                <ContactButton variant="primary">
                  Conheça nossos Ambientes de Pesquisa e acelere sua P&D
                </ContactButton>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- BRChain News (integração) ---------------- */}
        {/* <CareLoop /> */}

        {/* ---------------- Soluções Corporativas ---------------- */}
        <section id="solucoes" className={styles.solucoes}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Soluções Corporativas e Integração via APIs: Interoperabilidade com Segurança Profunda</h2>
              <p>
                A transformação digital no setor de saúde exige que sistemas legados, prontuários eletrônicos e plataformas de telemedicina conversem entre si com fluidez. No entanto, cada nova conexão não pode representar uma nova vulnerabilidade.
                <br/> <br/>
                A BRChain atua como o motor invisível e seguro da sua operação. Oferecemos uma suíte de soluções B2B e APIs robustas projetadas para injetar governança avançada, rastreabilidade e conformidade regulatória.
              </p>
            </div>

            <AgentsCarousel>
              <div className={styles.agentCard}>
                <h4>API as a Service: Criptografia e Consentimento</h4>
                <p>
                  Integre o núcleo tecnológico da BRChain aos seus sistemas (HIS/LIS) com agilidade. Nossas APIs permitem autenticar identidades e gerenciar o consentimento do paciente em tempo real.
                </p>
              </div>

              <div className={styles.agentCard}>
                <h4>Engenharia de Dados para o Futuro Analítico</h4>
                <p>
                  Sistemas de saúde geram volumes massivos de informações presas em silos. Nossa arquitetura extrai e estrutura esses dados, preparando o terreno para Data Lakes corporativos e IA.
                </p>
              </div>

              <div className={styles.agentCard}>
                <h4>Licenciamento de Propriedade Intelectual</h4>
                <p>
                  Para consórcios e redes que demandam internalização. Licenciamos nossos algoritmos proprietários para você acelerar sua maturidade digital utilizando uma arquitetura já validada.
                </p>
              </div>

              <div className={styles.agentCard}>
                <h4>Escalabilidade Inteligente e Validação</h4>
                <p>
                  Modelos de integração adaptáveis. Seja por pay-per-use, assinaturas ou licenciamento de PI, garantimos que o investimento tecnológico da sua empresa seja escalável e previsível.
                </p>
              </div>
            </AgentsCarousel>

            <div className={styles.center} style={{ marginTop: 40 }}>
              <ContactButton variant="primary">Acesse nossa Documentação de API e Fale com Nossos Especialistas</ContactButton>
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
