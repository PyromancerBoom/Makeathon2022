$(document).ready(function(){
    $nav = $('.nav');
    $toggleCollapse = $('.toggle-collapse');

    // When Toggle menu is clicked
    $toggleCollapse.click(function(){
        $nav.toggleClass('collapse');
    })
});

