// בתוך קומפוננטת ה-Checkout של הלקוח
const [paymentMethod, setPaymentMethod] = useState<'credit' | 'counter'>('credit');

const handleFinalOrder = async () => {
  const { data: order, error } = await supabase.from('orders').insert({
    customer_name: name,
    phone: phone,
    payment_method: paymentMethod, // 'credit' או 'counter'
    status: 'pending'
  }).select().single();

  if (paymentMethod === 'credit') {
    // הפניה ללוגיקת סליקה/הקלדת אשראי
    router.push(`/payment?orderId=${order.id}`);
  } else {
    // הודעת סיום - נא לגשת לדלפק
    toast.success("הזמנה התקבלה! נא לגשת לקופה לתשלום");
    router.push('/success');
  }
};
