const handleSave = async (sku: string) => {
  setLoading(true);
  try {
    console.log("מנסה לשמור מוצר:", sku, editForm);

    const { data, error } = await supabase
      .from("inventory")
      .update({
        product_name: editForm.product_name,
        description: editForm.description,
        image_url: editForm.image_url,
        youtube_url: editForm.youtube_url,
        coverage: editForm.coverage,
        price: editForm.price,
        // אם יש metadata, וודא שהוא נשלח כאובייקט
        metadata: typeof editForm.metadata === 'string' ? JSON.parse(editForm.metadata) : editForm.metadata
      })
      .eq("sku", sku)
      .select(); // מחזיר את השורה המעודכנית לאישור

    if (error) {
      console.error("שגיאת Supabase:", error);
      throw error;
    }

    if (data) {
      toast.success("המוצר עודכן בהצלחה!");
      setEditingSku(null);
      fetchProducts(); // רענון הרשימה מהשרת
    }
  } catch (err: any) {
    toast.error("שגיאה בשמירה: " + (err.message || "בדוק את ה-Console"));
  } finally {
    setLoading(false);
  }
};
