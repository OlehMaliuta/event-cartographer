﻿using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace EventCartographer.Server.Services.Email
{
	public class EmailService : IEmailService
	{
		private readonly EmailServiceConfigurationMetadata configuration;

		private string EmailTemplatesFolder => Path.IsPathRooted(configuration.EmailTemplatesFolder) ?
			configuration.EmailTemplatesFolder :
			Path.Combine(Directory.GetCurrentDirectory(), configuration.EmailTemplatesFolder);

		public EmailService(IOptions<EmailServiceConfigurationMetadata> configuration)
		{
			this.configuration = configuration.Value;
		}

		public async Task SendEmailAsync(string email, string subject, string message, bool isHtml = false)
		{
            using SmtpClient client = Connect();
            using MailMessage mailMessage = new(configuration.Email, email, subject, message);

            mailMessage.IsBodyHtml = isHtml;
            await client.SendMailAsync(mailMessage);
        }

		public async Task SendEmailUseTemplateAsync(string email, string templateName, Dictionary<string, string>? parameters = null, string? subject = null)
		{
			string templatePath = Path.Combine(EmailTemplatesFolder, templateName);
			if (!File.Exists(templatePath))
			{
				throw new FileNotFoundException($"Template {templateName} not found");
			}

			string template = File.ReadAllText(templatePath);
			if (parameters != null)
			{
				foreach (var parameter in parameters)
				{
					template = template.Replace($@"{{{{{parameter.Key}}}}}", parameter.Value);
				}
			}

			subject ??= Regex.Match(template, @"<meta name=""subject"" content=""(.*)""").Groups[1].Value;

			await SendEmailAsync(email, subject, template, true);
		}

		private SmtpClient Connect()
		{
            SmtpClient smtpClient = new()
            {
                Host = configuration.Host,
                Port = configuration.Port,
                EnableSsl = configuration.UseSSL,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = configuration.UseDefaultCredentials,
                Credentials = new NetworkCredential(configuration.Email, configuration.Password)
            };
            return smtpClient;
		}
	}
}
