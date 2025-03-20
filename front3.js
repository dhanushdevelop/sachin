document.getElementById("xeroxForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    const phone = document.getElementById("phone").value;
    const payment = document.getElementById("payment").value;
    const pdfFile = document.getElementById("pdfFile").files[0];
    const copies = parseInt(document.getElementById("copies").value);

    const pricePerPage = 1.5; // Fixed price per page
    const totalPages = 11; // Assuming a default value; integrate a PDF parser to calculate

    const totalAmount = totalPages * pricePerPage * copies;

    // Display order details
    document.getElementById("outputName").textContent = name;
    document.getElementById("outputAddress").textContent = address;
    document.getElementById("outputPhone").textContent = phone;
    document.getElementById("outputPayment").textContent = payment;
    document.getElementById("outputFile").textContent = pdfFile.name;
    document.getElementById("outputCopies").textContent = copies;
    document.getElementById("totalAmount").textContent = totalAmount.toFixed(2);

    document.getElementById("orderDetails").classList.remove("hidden");
});
