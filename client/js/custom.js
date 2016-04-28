var x;
var b1 = document.getElementById('run');

function showX() {
    alert(x);
};
b1.onclick = function() {
    x = 1;
 showX();};
function tn() {
        if (x == 1)
        document.getElementById('loadingbar').style.visibility='hidden';
        else
        document.getElementById('loadingbar').style.visibility='visible';
}