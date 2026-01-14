const axios = require('axios');

class JotformService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getFormSubmissions(formId) {
    try {
      const response = await axios.get(`https://api.jotform.com/form/${formId}/submissions?apiKey=${this.apiKey}`);
      return response.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

module.exports = JotformService;
