export const sendEmail = async (emailBody) => {
  const data = await fetch("https://emailer-iutl.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailBody),
  });
  const response = await data.json();
  return response;
};
