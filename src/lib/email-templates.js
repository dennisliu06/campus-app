export const EmailTemplate = ({ senderName, message, chatUrl }) => (
  <div
    style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}
  >
    <h2 style={{ color: "#8163e9" }}>You have a new message!</h2>
    <p>
      <strong>{senderName}</strong> sent you a message:
    </p>
    <div
      style={{
        padding: "15px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        margin: "15px 0",
      }}
    >
      <p style={{ margin: 0 }}>{message}</p>
    </div>
    <a
      href={chatUrl}
      style={{
        display: "inline-block",
        backgroundColor: "#8163e9",
        color: "white",
        padding: "10px 20px",
        textDecoration: "none",
        borderRadius: "5px",
        marginTop: "15px",
      }}
    >
      View Conversation
    </a>
    <p style={{ color: "#666", fontSize: "12px", marginTop: "30px" }}>
      This is an automated notification from your chat application.
    </p>
  </div>
);
