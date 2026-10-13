import { NextResponse } from "next/server";
import { Resend } from "resend";

/** Campos do formulário e o tamanho máximo aceito para cada um. */
const LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  institution: 160,
  message: 5000,
} as const;

type Field = keyof typeof LIMITS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Remove quebras de linha (evita injeção em cabeçalhos como o assunto). */
function singleLine(s: string) {
  return s.replace(/[\r\n]+/g, " ");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // Normaliza e valida cada campo: obrigatório, texto e dentro do limite.
  const fields = {} as Record<Field, string>;
  for (const key of Object.keys(LIMITS) as Field[]) {
    const raw = body[key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }
    if (value.length > LIMITS[key]) {
      return NextResponse.json(
        { error: "Um ou mais campos excedem o tamanho permitido." },
        { status: 400 }
      );
    }
    fields[key] = value;
  }

  const { name, email, phone, institution, message } = fields;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      { error: "Serviço de e-mail não configurado." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: singleLine(`[BRChain] Novo contato — ${name} (${institution})`),
      html: `
        <h2>Novo contato via "Fale com um Especialista"</h2>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Celular:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Instituição:</strong> ${escapeHtml(institution)}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: "Não foi possível enviar. Tente novamente mais tarde." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao enviar a mensagem." },
      { status: 500 }
    );
  }
}
