const request = require('request');

const baseUrl = 'https://f4a7a8aa.ngrok.io/adidas';

function checkStock(productName, size, cb) {
  let url = `${baseUrl}/stock`;
  let params = {
    url,
    method: 'GET',
    qs: {
      productName,
      size
    },
    json: true
  };

  request(params, (err, resp) => {
    let stores = (!err && resp && resp.body && Array.isArray(resp.body) && resp.body.length)
      ? resp.body : [];
    stores = stores.map((elem) => {
      return {
        store_id: elem.store.code,
        name: elem.product.name,
        imageUrl: elem.product.url,
        stock: elem.quantity,
        timerange: ['19:30', '16:30', '15:30']
      }
    });
    cb(stores);
  });
}

// function arrangeAppointment() {
  
// }


module.exports = {
  checkStock
};
