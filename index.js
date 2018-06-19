const express = require('express');
const app = express();
const static = express.static;
const rp = require('request-promise');
const cheerio = require('cheerio');

const apiURL = 'https://anapioficeandfire.com/api/';
const scrapingURL = 'https://imgur.com/r/Eyebleach';


// Handlebar registration
const expressHbs = require('express-handlebars');
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use(static('public'));
// Handlebar registration

app.get('/eyebleach', (req, res) => {
  const options = {
    uri: scrapingURL,
    transform: (body) => {
      return cheerio.load(body);
    }
  };
  rp(options)
    .then(handleData)
    .catch(handleError)
  function handleData($) {
    let images = []
    let selector = 'a.image-list-link img'
    $(selector).each( (i, element) => {
      let href = 'https:' + $(element).attr('src');
      let imgPage = getImgurLink(href)
      images.push({
        href,
        imgPage
      });
    });
    res.render('eyebleach', {images});
  }
  function getImgurLink(urlString) {
    let parts = urlString.split('/');
    let endParts = parts[parts.length - 1].split('.');
    let imgPathPart = endParts[0].slice(0, endParts[0].length - 1);
    return `https://imgur.com/r/Eyebleach/${imgPathPart}`;
  }
});

app.get('/books/:id', (req, res) => {
  let url = apiURL + 'books/' + req.params.id;
  rp(url)
    .then(handleData)
    .catch(handleError)
  function handleData (book) {
    book = JSON.parse(book);
    book.releasedFormatted = formatReleasedDate(book.released);
    res.render('bookdetail', {book});
  }
  function formatReleasedDate(dateString) {
    let rd = new Date(dateString);
    let month = rd.toLocaleString("en-us", {month: "long"});
    let day = rd.getDate();
    let year = rd.getFullYear();
    return `${month} ${day}, ${year}`;
  }
});

app.get('/books', (req, res) => {
  let url = apiURL + 'books';
  rp(url)
    .then(handleData)
    .catch(handleError)
  function handleData (books) {
    books = JSON.parse(books);
    books.forEach(book => {
      book.id = getID(book.url);
    });
    res.render('books', {books});
  }  
  function getID(urlString) {
    let parts = urlString.split('/');
    return parts[parts.length - 1];

  }
});

app.get('/', (req, res) => {
  res.render('home');
});

function handleError(err) {
  console.log(err.message);
}

app.listen(9999);