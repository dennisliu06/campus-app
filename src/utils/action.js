"use server";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function sendChatNotification({
  to,
  senderName,
  message,
  chatId,
}) {
  try {
    console.log("to , sendername ", to, senderName, message, chatId);
    console.log("resend key", resend);
    const { data, error } = await resend.emails.send({
      from: "Chat Notification <notifications@yourdomain.com>",
      to: [to],
      subject: `New message from ${senderName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8163e9;">You have a new message!</h2>
          <p><strong>${senderName}</strong> sent you a message:</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0;">${message}</p>
          </div>
          <a href="${APP_URL}/chat/${chatId}" style="display: inline-block; background-color: #8163e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            View Conversation
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from your chat application.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
