$( document ).ready(function() {
  $(window).resize(function(){
    resize();
  });
  resize();
});

function resize() {
  $(".inner").each(function(index){
    var jelem = $(this);
    var jparent = $(this.parentNode);
    if (jparent.hasClass("leftSide") || jparent.hasClass("rightSide")) {
      jelem.css({
        "margin-top": (jparent.height()/2 - jelem.height()/2) + "px"
      });
    } else {
      jparent.css({"left": $(".leftSide").width()});
    }
  });
}
