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
        store_location: elem.store.location,
        product_id: elem.product.code,
        product_name: elem.product.name,
        store_name: elem.store.name,
        imageUrl: elem.product.url,
        stock: elem.quantity,
        timerange: ['19:30', '16:30', '15:30']
      }
    });
    stores = stores.filter((store) => {
      return store.stock ? true : false;
    })
    cb(stores);
  });
}

function arrangeAppointment(productId, hourOfDay, storeId, cb) {
  let body = {
    productId,
    hourOfDay,
    storeId,
    dayOfWeek: 'MONDAY'
  };

  let url = `${baseUrl}/appointment`;

  let params = {
    url,
    method: 'POST',
    body,
    json: true
  }

  request(params, (err, resp) => {
    let appointmentId = (!err && resp && resp.body && resp.body.id)
      ? resp.body.id : 0;

    cb(appointmentId);
  })
}


module.exports = {
  checkStock,
  arrangeAppointment
};
