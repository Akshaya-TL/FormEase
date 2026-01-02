import React, { useState } from "react";

const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_MB = 5;

export default function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Basic email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!isValidEmail(email)) newErrors.email = "Invalid email format.";
    if (!message.trim()) newErrors.message = "Message is required.";
    else if (message.trim().length < 20)
      newErrors.message = "Message must be at least 20 characters.";

    if (attachment) {
      if (!ALLOWED_FILE_TYPES.includes(attachment.type))
        newErrors.attachment = "Invalid file type (only PDF, JPG, PNG allowed).";
      if (attachment.size / (1024 * 1024) > MAX_FILE_SIZE_MB)
        newErrors.attachment = `File must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setAttachment(file || null);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSuccess(false);
  if (!validate()) return;

  setIsSubmitting(true);

  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("message", message);
  if (attachment) formData.append("attachment", attachment);

  try {
    const response = await fetch("http://localhost:3001/api/form", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Server error");
    }

    setIsSuccess(true);
    setName("");
    setEmail("");
    setMessage("");
    setAttachment(null);
    setErrors({});
  } catch (err) {
    console.error(err);
    setErrors({ form: err.message || "Failed to submit. Please try again later." });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Name */}
      <div style={styles.field}>
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ ...styles.input, borderColor: errors.name ? "red" : "#ccc" }}
        />
        {errors.name && <div style={styles.error}>{errors.name}</div>}
      </div>

      {/* Email */}
      <div style={styles.field}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            ...styles.input,
            borderColor: errors.email ? "red" : "#ccc",
          }}
        />
        {errors.email && <div style={styles.error}>{errors.email}</div>}
      </div>

      {/* Message */}
      <div style={styles.field}>
        <label>Message</label>
        <textarea
          rows="5"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            ...styles.textarea,
            borderColor: errors.message ? "red" : "#ccc",
          }}
        />
        {errors.message && <div style={styles.error}>{errors.message}</div>}
      </div>

      {/* Attachment */}
      <div style={styles.field}>
        <label>Attachment (optional)</label>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
        {attachment && (
          <div style={styles.fileName}>Selected: {attachment.name}</div>
        )}
        {errors.attachment && <div style={styles.error}>{errors.attachment}</div>}
      </div>

      {/* General Error */}
      {errors.form && <div style={styles.error}>{errors.form}</div>}

      {/* Submit Button */}
      <button type="submit" disabled={isSubmitting} style={styles.button}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>

      {/* Success Message */}
      {isSuccess && (
        <div style={styles.success}>Form submitted successfully!</div>
      )}
    </form>
  );
}

const styles = {
  form: { maxWidth: "600px", margin: "0 auto" },
  field: { marginBottom: "15px", display: "flex", flexDirection: "column" },
  input: { padding: "8px", borderRadius: "4px", border: "1px solid #ccc" },
  textarea: { padding: "8px", borderRadius: "4px", border: "1px solid #ccc" },
  error: { color: "red", fontSize: "0.9rem", marginTop: "4px" },
  success: { color: "green", marginTop: "10px" },
  button: {
    backgroundColor: "#2e8b57",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  fileName: { fontSize: "0.9rem", marginTop: "5px" },
};
