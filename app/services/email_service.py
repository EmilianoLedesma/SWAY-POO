import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header

WEB2_URL = os.getenv("WEB2_URL", "http://localhost:5173")


def _build_html(nombre: str, institucion: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenido a SWAY</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(55,81,126,0.12);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#37517e;padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;
                        color:#47b2e4;font-weight:600;">Conservación Marina</p>
              <h1 style="margin:8px 0 0;font-size:36px;font-weight:800;
                         color:#ffffff;letter-spacing:2px;">SWAY</h1>
              <div style="width:48px;height:3px;background:#47b2e4;
                          margin:12px auto 0;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- BANNER ACCENT -->
          <tr>
            <td style="background-color:#47b2e4;padding:10px 40px;">
              <p style="margin:0;font-size:12px;color:#ffffff;text-align:center;
                        letter-spacing:1px;font-weight:500;">
                PORTAL DE COLABORADORES CIENTÍFICOS
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:44px 40px 36px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#37517e;">
                ¡Bienvenido, {nombre}!
              </p>
              <p style="margin:0 0 28px;font-size:13px;color:#47b2e4;
                        font-weight:600;letter-spacing:0.5px;">
                {institucion}
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#444444;">
                Nos complace informarte que tu solicitud para unirte a la red de
                colaboradores científicos de <strong style="color:#37517e;">SWAY
                Conservación Marina</strong> ha sido <strong>revisada y aceptada</strong>.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#444444;">
                A partir de este momento tienes acceso completo al portal colaborativo,
                donde podrás registrar especies, reportar avistamientos y contribuir
                activamente a la conservación del ecosistema marino.
              </p>

              <div style="height:1px;background:#f5f6f8;margin:0 0 28px;"></div>

              <!-- ACCESS BOX -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#f5f6f8;border-radius:8px;
                            border-left:4px solid #47b2e4;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#47b2e4;
                               font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      Tu acceso al portal
                    </p>
                    <p style="margin:0 0 4px;font-size:14px;color:#444444;line-height:1.6;">
                      Ingresa con el correo y contraseña que registraste.
                    </p>
                    <p style="margin:0;font-size:13px;color:#888888;">
                      Si experimentas algún problema al acceder, contáctanos y con
                      gusto te asistiremos.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{WEB2_URL}"
                       style="display:inline-block;background-color:#47b2e4;
                              color:#ffffff;text-decoration:none;font-size:15px;
                              font-weight:700;padding:14px 40px;border-radius:6px;
                              letter-spacing:0.5px;">
                      Acceder al Portal SWAY
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#aaaaaa;text-align:center;">
                O copia y pega este enlace en tu navegador:<br/>
                <span style="color:#47b2e4;">{WEB2_URL}</span>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#37517e;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#ffffff;">
                SWAY — Conservación Marina
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#a8bcd4;line-height:1.6;">
                Este correo fue generado automáticamente. Por favor no respondas a este mensaje.<br/>
                Si no solicitaste este registro, ignora este correo.
              </p>
              <p style="margin:0;font-size:11px;color:#6b84a3;">
                © 2025 SWAY Conservación Marina. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _build_text(nombre: str, institucion: str) -> str:
    return (
        f"¡Bienvenido, {nombre}!\n\n"
        f"{institucion}\n\n"
        "Tu solicitud para unirte a SWAY Conservación Marina ha sido revisada y aceptada.\n\n"
        f"Accede al portal aquí: {WEB2_URL}\n\n"
        "Si no solicitaste este registro, ignora este correo.\n"
        "© 2025 SWAY Conservación Marina."
    )


def send_welcome_email(nombre: str, email: str, institucion: str) -> None:
    """Envía el correo de bienvenida vía Gmail SMTP.
    Se ejecuta en background — los errores se loguean sin interrumpir el flujo."""
    try:
        smtp_host = os.getenv("MAIL_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("MAIL_PORT", "587"))
        smtp_user = os.getenv("MAIL_USER", "")
        smtp_pass = os.getenv("MAIL_PASS", "")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "¡Tu acceso como colaborador SWAY ha sido aprobado!"
        sender_email = os.getenv("MAIL_FROM", f"noreply@proyecto-sway.site")
        msg["From"]    = f"{Header('SWAY Conservacion Marina', 'utf-8')} <{sender_email}>"
        msg["To"]      = email

        msg.attach(MIMEText(_build_text(nombre, institucion), "plain", "utf-8"))
        msg.attach(MIMEText(_build_html(nombre, institucion), "html",  "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, [email], msg.as_string())

        print(f"[EMAIL] Bienvenida enviada a {email}")

    except Exception as e:
        print(f"[EMAIL ERROR] No se pudo enviar correo a {email}: {e}")


# ── Newsletter ────────────────────────────────────────────────────────────────

def _build_newsletter_confirmation_html() -> str:
    return """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenido al Newsletter de SWAY</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;
                      box-shadow:0 6px 32px rgba(30,80,120,0.13);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d3b5e 0%,#1a6b8a 60%,#47b2e4 100%);
                       padding:44px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;
                        color:#a8dff0;font-weight:600;">Conservación Marina</p>
              <h1 style="margin:10px 0 4px;font-size:42px;font-weight:900;
                         color:#ffffff;letter-spacing:3px;">SWAY</h1>
              <p style="margin:0;font-size:13px;color:#cceeff;letter-spacing:1px;">
                Sistema de Monitoreo y Conservación Marina
              </p>
              <div style="width:60px;height:3px;background:#47b2e4;
                          margin:16px auto 0;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- BANNER -->
          <tr>
            <td style="background-color:#47b2e4;padding:10px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#ffffff;letter-spacing:1.5px;font-weight:600;">
                ¡YA ERES PARTE DE LA COMUNIDAD SWAY!
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:44px 40px 12px;">
              <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0d3b5e;">
                Gracias por unirte a nosotros
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#47b2e4;font-weight:600;letter-spacing:0.5px;">
                Tu suscripción marca una diferencia real
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#444444;">
                A partir de hoy recibirás noticias, descubrimientos y reportes sobre el estado
                de los ecosistemas marinos que SWAY monitorea activamente.
              </p>

              <!-- DATO CURIOSO -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:linear-gradient(135deg,#e8f6fd,#f0faff);
                            border-radius:10px;border-left:5px solid #47b2e4;
                            margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 8px;font-size:11px;color:#47b2e4;font-weight:700;
                               letter-spacing:2px;text-transform:uppercase;">
                      ¿Sabías que...?
                    </p>
                    <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0d3b5e;
                               line-height:1.5;">
                      Solo el 3% del océano está formalmente protegido, aunque cubre el 71% de nuestro planeta.
                    </p>
                    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
                      SWAY nació como respuesta a esa brecha. Cada especie catalogada,
                      cada avistamiento registrado y cada dato compartido en nuestra plataforma
                      construye el argumento científico que los organismos de protección ambiental
                      necesitan para actuar. <strong style="color:#1a6b8a;">Tú acabas de sumarte a esa causa.</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- TRES PILARES -->
              <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#0d3b5e;
                         letter-spacing:0.5px;text-transform:uppercase;">
                Lo que encontrarás en cada edición
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="33%" style="padding:0 8px 0 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;text-align:center;">
                      <tr>
                        <td style="padding:20px 12px;">
                          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0d3b5e;">
                            Especies
                          </p>
                          <p style="margin:0;font-size:11px;color:#777;line-height:1.5;">
                            Nuevas catalogaciones y estados de conservación
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" style="padding:0 4px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;text-align:center;">
                      <tr>
                        <td style="padding:20px 12px;">
                          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0d3b5e;">
                            Datos
                          </p>
                          <p style="margin:0;font-size:11px;color:#777;line-height:1.5;">
                            Estadísticas y tendencias del ecosistema marino
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" style="padding:0 0 0 8px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;text-align:center;">
                      <tr>
                        <td style="padding:20px 12px;">
                          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0d3b5e;">
                            Impacto
                          </p>
                          <p style="margin:0;font-size:11px;color:#777;line-height:1.5;">
                            Avances reales de la comunidad científica SWAY
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0d3b5e;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#ffffff;">
                SWAY — Conservación Marina
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#7aaec8;line-height:1.6;">
                Este correo fue generado automáticamente. Por favor no respondas a este mensaje.<br/>
                Si no solicitaste esta suscripción, puedes ignorar este correo.
              </p>
              <p style="margin:0;font-size:11px;color:#4a7a9b;">
                © 2025 SWAY Conservación Marina. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _build_newsletter_html() -> str:
    return """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Newsletter SWAY — Edición #1</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;
                      box-shadow:0 6px 32px rgba(30,80,120,0.13);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d3b5e 0%,#1a6b8a 60%,#47b2e4 100%);
                       padding:36px 40px 28px;text-align:center;">
              <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;
                        color:#a8dff0;font-weight:600;">Newsletter Oficial · Edición #1</p>
              <h1 style="margin:10px 0 4px;font-size:38px;font-weight:900;
                         color:#ffffff;letter-spacing:3px;">SWAY</h1>
              <p style="margin:0;font-size:12px;color:#cceeff;">
                Sistema de Monitoreo y Conservación Marina
              </p>
              <div style="width:60px;height:3px;background:#47b2e4;margin:14px auto 0;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- FECHA -->
          <tr>
            <td style="background-color:#47b2e4;padding:8px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#ffffff;letter-spacing:1px;font-weight:500;">
                MARZO 2025 — PRIMERA EDICIÓN
              </p>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 40px 28px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0d3b5e;">
                El océano nos habla. Nosotros lo escuchamos.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#555;">
                Bienvenido a la primera edición del newsletter de SWAY. Aquí encontrarás
                los avances más recientes de nuestra plataforma, datos del ecosistema marino
                y el trabajo que nuestra comunidad científica realiza cada día.
              </p>
              <div style="height:1px;background:#eef3f7;margin:0 0 28px;"></div>

              <!-- ESTADISTICA DESTACADA -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:linear-gradient(135deg,#0d3b5e,#1a6b8a);
                            border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:28px 32px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#a8dff0;letter-spacing:2px;
                               text-transform:uppercase;font-weight:600;">
                      Dato del mes
                    </p>
                    <p style="margin:0 0 8px;font-size:44px;font-weight:900;color:#ffffff;">
                      1,247
                    </p>
                    <p style="margin:0;font-size:14px;color:#cceeff;line-height:1.6;">
                      especies marinas catalogadas en SWAY hasta la fecha,<br/>
                      de las cuales <strong style="color:#47b2e4;">312 se encuentran en algún grado de amenaza.</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- SECCION: ESPECIE DEL MES -->
              <p style="margin:0 0 4px;font-size:11px;color:#47b2e4;font-weight:700;
                         letter-spacing:2px;text-transform:uppercase;">
                Especie del mes
              </p>
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0d3b5e;">
                Tortuga Laúd — <em style="font-weight:400;color:#555;">Dermochelys coriacea</em>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f5fbff;border-radius:8px;
                            border-left:4px solid #47b2e4;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;font-size:14px;color:#444;line-height:1.8;">
                      La tortuga más grande del mundo puede llegar a pesar <strong>900 kg</strong> y
                      recorrer más de <strong>20,000 km</strong> en sus migraciones anuales.
                      A pesar de haber sobrevivido más de 100 millones de años, hoy enfrenta
                      su mayor amenaza: la contaminación plástica y la pesca incidental.
                      SWAY registra avistamientos en tiempo real para colaborar con
                      programas de protección de nidadas en costas del Pacífico mexicano.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- SECCION: IMPACTO -->
              <p style="margin:0 0 16px;font-size:11px;color:#47b2e4;font-weight:700;
                         letter-spacing:2px;text-transform:uppercase;">
                Impacto de la comunidad SWAY
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="50%" style="padding:0 8px 8px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;text-align:center;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:#1a6b8a;">
                            48,200 L
                          </p>
                          <p style="margin:0;font-size:12px;color:#777;">Agua marina analizada</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding:0 0 8px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;text-align:center;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:#1a6b8a;">
                            3,840
                          </p>
                          <p style="margin:0;font-size:12px;color:#777;">Corales plantados</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;text-align:center;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:#1a6b8a;">
                            892 kg
                          </p>
                          <p style="margin:0;font-size:12px;color:#777;">Plástico recuperado</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding:0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;text-align:center;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:#1a6b8a;">
                            214
                          </p>
                          <p style="margin:0;font-size:12px;color:#777;">Familias beneficiadas</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td align="center">
                    <a href="http://proyecto-sway.site"
                       style="display:inline-block;background-color:#47b2e4;
                              color:#ffffff;text-decoration:none;font-size:14px;
                              font-weight:700;padding:14px 40px;border-radius:6px;
                              letter-spacing:0.5px;">
                      Visitar proyecto-sway.site
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0d3b5e;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#ffffff;">
                SWAY — Conservación Marina
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#7aaec8;line-height:1.6;">
                Recibiste este correo porque te suscribiste al newsletter de SWAY.<br/>
                Este es un envío demostrativo. No respondas a este mensaje.
              </p>
              <p style="margin:0;font-size:11px;color:#4a7a9b;">
                © 2025 SWAY Conservación Marina. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_newsletter_confirmation(email: str) -> None:
    """Correo de confirmación de suscripción al newsletter."""
    try:
        smtp_host = os.getenv("MAIL_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("MAIL_PORT", "587"))
        smtp_user = os.getenv("MAIL_USER", "")
        smtp_pass = os.getenv("MAIL_PASS", "")
        sender_email = os.getenv("MAIL_FROM", "noreply@proyecto-sway.site")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "¡Bienvenido al newsletter de SWAY Conservación Marina!"
        msg["From"]    = f"{Header('SWAY Conservacion Marina', 'utf-8')} <{sender_email}>"
        msg["To"]      = email

        text = (
            "¡Gracias por suscribirte al newsletter de SWAY!\n\n"
            "Solo el 3% del océano está formalmente protegido. "
            "Tu interés contribuye a cambiar eso.\n\n"
            "Pronto recibirás noticias, datos y reportes de conservación marina.\n\n"
            "© 2025 SWAY Conservación Marina."
        )
        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(_build_newsletter_confirmation_html(), "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, [email], msg.as_string())

        print(f"[EMAIL] Confirmacion newsletter enviada a {email}")

    except Exception as e:
        print(f"[EMAIL ERROR] No se pudo enviar confirmacion newsletter a {email}: {e}")


def send_newsletter(email: str, nombre: str = "Suscriptor") -> None:
    """Envía el newsletter a un suscriptor."""
    try:
        smtp_host = os.getenv("MAIL_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("MAIL_PORT", "587"))
        smtp_user = os.getenv("MAIL_USER", "")
        smtp_pass = os.getenv("MAIL_PASS", "")
        sender_email = os.getenv("MAIL_FROM", "noreply@proyecto-sway.site")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "SWAY Newsletter — Edicion #1: El oceano nos habla"
        msg["From"]    = f"{Header('SWAY Conservacion Marina', 'utf-8')} <{sender_email}>"
        msg["To"]      = email

        text = (
            "SWAY Newsletter — Edicion #1\n\n"
            "1,247 especies catalogadas. 312 en algun grado de amenaza.\n\n"
            "Especie del mes: Tortuga Laud (Dermochelys coriacea)\n"
            "Impacto: 48,200 L de agua analizada, 3,840 corales plantados.\n\n"
            f"Visita el proyecto: http://proyecto-sway.site\n\n"
            "© 2025 SWAY Conservacion Marina."
        )
        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(_build_newsletter_html(), "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, [email], msg.as_string())

        print(f"[EMAIL] Newsletter enviado a {email}")

    except Exception as e:
        print(f"[EMAIL ERROR] No se pudo enviar newsletter a {email}: {e}")


# ── Donación ──────────────────────────────────────────────────────────────────

def _build_donacion_html(nombre: str, monto: float) -> str:
    monto_fmt = f"${monto:,.2f} MXN"
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Gracias por tu donación — SWAY</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;
                      box-shadow:0 6px 32px rgba(30,80,120,0.13);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d3b5e 0%,#1a6b8a 60%,#47b2e4 100%);
                       padding:44px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;
                        color:#a8dff0;font-weight:600;">Conservación Marina</p>
              <h1 style="margin:10px 0 4px;font-size:42px;font-weight:900;
                         color:#ffffff;letter-spacing:3px;">SWAY</h1>
              <p style="margin:0;font-size:13px;color:#cceeff;letter-spacing:1px;">
                Sistema de Monitoreo y Conservación Marina
              </p>
              <div style="width:60px;height:3px;background:#47b2e4;margin:16px auto 0;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- BANNER -->
          <tr>
            <td style="background-color:#47b2e4;padding:10px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#ffffff;letter-spacing:1.5px;font-weight:600;">
                CONFIRMACIÓN DE DONACIÓN
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:44px 40px 36px;">
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0d3b5e;">
                Gracias, {nombre}.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#47b2e4;font-weight:600;letter-spacing:0.5px;">
                Tu aportación llega en el momento justo.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#444444;">
                Hemos recibido tu donación a <strong style="color:#0d3b5e;">SWAY Conservación Marina</strong>.
                Cada peso que contribuyes se destina directamente a las actividades de monitoreo,
                catalogación de especies y restauración de ecosistemas marinos en México.
              </p>

              <!-- MONTO -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:linear-gradient(135deg,#0d3b5e,#1a6b8a);
                            border-radius:10px;margin-bottom:28px;text-align:center;">
                <tr>
                  <td style="padding:28px 32px;">
                    <p style="margin:0 0 6px;font-size:11px;color:#a8dff0;
                               letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                      Monto donado
                    </p>
                    <p style="margin:0;font-size:40px;font-weight:900;color:#ffffff;">
                      {monto_fmt}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- USO DE LA DONACION -->
              <p style="margin:0 0 16px;font-size:11px;color:#47b2e4;font-weight:700;
                         letter-spacing:2px;text-transform:uppercase;">
                En qué se usará tu donación
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:0 0 10px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;
                                  border-left:4px solid #47b2e4;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0d3b5e;">
                            Catalogación de especies
                          </p>
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                            Financiamos el trabajo de biólogos marinos que documentan especies
                            en zonas costeras de difícil acceso. Cada registro contribuye a la
                            base de datos científica más completa del país.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px 0;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;
                                  border-left:4px solid #1a6b8a;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0d3b5e;">
                            Restauración de arrecifes de coral
                          </p>
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                            Los arrecifes de coral albergan el 25% de todas las especies marinas
                            conocidas, a pesar de ocupar menos del 1% del fondo oceánico.
                            Tu donación apoya la siembra y monitoreo de colonias de coral.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f5fbff;border-radius:8px;
                                  border-left:4px solid #0d3b5e;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0d3b5e;">
                            Educación ambiental comunitaria
                          </p>
                          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                            Llevamos talleres de educación ambiental a comunidades costeras.
                            Las familias que comprenden el valor del océano son sus mejores
                            guardianes a largo plazo.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- DATO CURIOSO -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:linear-gradient(135deg,#e8f6fd,#f0faff);
                            border-radius:10px;border-left:5px solid #47b2e4;
                            margin-bottom:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:11px;color:#47b2e4;font-weight:700;
                               letter-spacing:2px;text-transform:uppercase;">
                      ¿Sabías que...?
                    </p>
                    <p style="margin:0;font-size:14px;color:#444;line-height:1.8;">
                      El océano absorbe aproximadamente el <strong style="color:#0d3b5e;">30% del CO2</strong>
                      que los humanos producimos cada año. Sin océanos saludables, el cambio climático
                      avanzaría a un ritmo considerablemente mayor. Cada acción de conservación marina
                      es también una acción climática.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0d3b5e;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#ffffff;">
                SWAY — Conservación Marina
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#7aaec8;line-height:1.6;">
                Este correo fue generado automáticamente. Por favor no respondas a este mensaje.<br/>
                Si no realizaste esta donación, contáctanos de inmediato.
              </p>
              <p style="margin:0;font-size:11px;color:#4a7a9b;">
                © 2025 SWAY Conservación Marina. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_donation_thanks(nombre: str, email: str, monto: float) -> None:
    """Correo de agradecimiento por donacion."""
    try:
        smtp_host = os.getenv("MAIL_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("MAIL_PORT", "587"))
        smtp_user = os.getenv("MAIL_USER", "")
        smtp_pass = os.getenv("MAIL_PASS", "")
        sender_email = os.getenv("MAIL_FROM", "noreply@proyecto-sway.site")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"SWAY — Confirmacion de donacion por ${monto:,.2f} MXN"
        msg["From"]    = f"{Header('SWAY Conservacion Marina', 'utf-8')} <{sender_email}>"
        msg["To"]      = email

        text = (
            f"Gracias por tu donacion, {nombre}.\n\n"
            f"Hemos recibido tu aportacion de ${monto:,.2f} MXN a SWAY Conservacion Marina.\n\n"
            "Tu donacion se destinara a catalogacion de especies, restauracion de arrecifes\n"
            "y educacion ambiental comunitaria.\n\n"
            "Dato: El oceano absorbe el 30% del CO2 que producimos. Conservarlo es tambien actuar contra el cambio climatico.\n\n"
            "© 2025 SWAY Conservacion Marina."
        )
        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(_build_donacion_html(nombre, monto), "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, [email], msg.as_string())

        print(f"[EMAIL] Donacion agradecida a {email}")

    except Exception as e:
        print(f"[EMAIL ERROR] No se pudo enviar agradecimiento donacion a {email}: {e}")
