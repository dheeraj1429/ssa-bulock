const request = require("request");

class MessageService {
  async sendMessage({ to, message, file }) {
    const options = {
      method: "POST",
      url: "https://whats-api.rcsoft.in/api/create-message",
      formData: {
        appkey: process.env.APP_KEY,
        authkey: process.env.ACCOUNT_AUTH_TOKEN,
        to,
        message,
        file,
      },
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });
  }
}

module.exports = MessageService;