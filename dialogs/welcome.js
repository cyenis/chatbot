let dialog = [
  (session, results, next) => {
    // send welcome to the user
    session.send('welcome');
  }
]

module.exports = dialog;