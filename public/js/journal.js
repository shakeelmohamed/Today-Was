$(".active").click();
            
function disableElement(elem) {
    $(elem).prop('disabled', true);
}
function enableElement(elem) {
    $(elem).prop('disabled', false);
}

$("#journalForm").submit(function (event) {
    event.preventDefault();

    // Temp save to localStorage
    localStorage.rating = $("#rating.active input").val();
    localStorage.journal = $("#journal").val().replace(/\s+$/,"");

    var validationMessage = "";
    if ($("#journal").val().replace(/\s+$/,"").length === 0) {
        validationMessage += "Enter a journal entry.";
    }
    if (!$(".rating-button").parent().hasClass("active")) {
        validationMessage += " Select a rating.";
    }
    if (validationMessage.length === 0) {
        var submitType = $("#submit").val();
        $("#submit").button("loading");
        disableElement("#journal");
        $("label#rating").addClass("disabled");
        $("#journalSuccess").hide();
        $("#journalFail").hide();
        $.ajax({
            type: "POST",
            url: "/entries",
            data: JSON.stringify({
                submit: submitType,
                rating: $("#rating.active input").val(),
                journal: $("#journal").val().replace(/\s+$/,""),
                ajax: true
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data){
                if (data.hasOwnProperty("status") && data.status === "success") {
                    $("#journalSuccess").show();
                    updateFeed();
                }
                else {
                    $("#journalFail span").text(data.error || "Woah, something went wrong and your journal entry didn't get saved.");
                    $("#journalFail").show();
                }
            },
            failure: function (errMsg) {
                // TODO: handle the case where there's no network connection
                $("#journalFail span").text(data.error || "Woah, it seems like there's a connection issue. Please try saving your journal entry again.");
                $("#journalFail").show();
            }
        }).done(function() {
            $("#submit").button("reset");
            enableElement("#journal");
            $("label#rating").removeClass("disabled");
        });
    }
    else { // If there's an invalid entry...
        $("#journalFail span").text(validationMessage);
        $("#journalFail").show();
    }
});

function makeJournalEntry(date, label, journal) {
    // TODO: add an image/div to hold the label simplify the UI
    var entry = "<li class=\"media\">";
    entry += "<div class=\"media-body text-left\">";
    entry += "<h4 class=\"media-heading text-center\">";
    entry += date + " - " + label;
    entry += "</h4>";
    entry += "<p style=\"word-wrap:break-word; white-space: pre;\">";
    entry += journal;
    entry += "</p>";
    entry += "<hr>";
    entry += "</div>";
    entry += "</li>"
    return entry;
}

function updateFeed() {
    $.ajax({
        type: "POST",
        url: "/feed",
        data: JSON.stringify({}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data){
            if (data.hasOwnProperty("feed")) {
                if (data.feed.length > 0) {
                    $("#noJournals").hide();
                }
                var feedHTML = "";
                for (var i = 0; i < data.feed.length; i++) {
                    var cur = data.feed[i];
                    feedHTML += makeJournalEntry(cur.created_date, cur.label, cur.entry);
                }
                $("#journalFeed").html(feedHTML);
            }
            else {
                $("#noJournals").show();
                $("#journalFail span").text(data.error || "Woah, something went wrong and we couldn't get your journal entries.");
            }
        },
        failure: function (errMsg) {
            // TODO: handle the case where there's no network connection
            $("#journalFail span").text(errMsg || "Woah, something went wrong and we couldn't get your journal entries.");
        }
    }).done(function() {
        return;
    });
}

$().ready(function() {
    updateFeed();
});