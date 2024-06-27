const getTimeDifferenceInDays = (timestamp1, timestamp2) => {
    // Convert Unix timestamps to milliseconds
    var date1 = new Date(timestamp1 * 1000);
    var date2 = new Date(timestamp2 * 1000);
  
    // Calculate the difference between the two dates
    var timeDifference = date2 - date1;
  
    // Convert the time difference to days
    var daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  
    return daysDifference;
}

module.exports = {
    getTimeDifferenceInDays
};
  