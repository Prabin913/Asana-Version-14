$(document).ready(function(){
    try {
        $('.version_num').html(chrome.runtime.getManifest().version);
    }
    catch(e)
    {
        console.log("couldn't read version");
    }
    
});