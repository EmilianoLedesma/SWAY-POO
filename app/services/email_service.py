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
