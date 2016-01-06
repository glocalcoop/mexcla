

$.ajax({
  type: 'post',
  url: '/users/new',
  data: {username: 'slothrop', lang: 'es'}
}).done(function(){
  console.log('ajax complete');
});
