// Front-end: send form data to backend endpoint /api/contact
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const waQuick = document.getElementById('waQuick');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending...';

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      message: document.getElementById('message').value.trim()
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (res.ok) {
        status.textContent = 'Message sent — we will contact you on WhatsApp soon.';
        form.reset();
      } else {
        status.textContent = body?.error || 'Failed to send message. Try again later.';
      }
    } catch (err) {
      console.error(err);
      status.textContent = 'Network error. Try again later.';
    }
  });

  // Quick WhatsApp button: open wa.me with message
  waQuick.addEventListener('click', () => {
    const name = document.getElementById('name').value.trim() || 'Customer';
    const text = encodeURIComponent(`${name} says hello — I want to enquire about Simplifyd Home.`);
    const waUrl = `https://wa.me/254743039253?text=${text}`;
    window.open(waUrl, '_blank');
  });
});
