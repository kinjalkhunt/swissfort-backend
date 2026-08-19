import Product from "../models/productEntry.js";

// Get all products
export const getAllProducts = async (filters = {}) => {
  try {
    const { search, productType } = filters;

    const query = {};

    // Search by product name or product code
    if (search && search.trim()) {
      query.$or = [
        {
          productName: {
            $regex: search.trim(),
            $options: 'i',
          },
        },
        {
          productCode: {
            $regex: search.trim(),
            $options: 'i',
          },
        },
      ];
    }

    // Filter by product type
    if (productType) {
      query.productType = productType;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 });

    return products;
  } catch (error) {
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id) => {
  try {
    const product = await Product.findById(id);
    return product;
  } catch (error) {
    throw error;
  }
};

// Get product by productCode
export const getProductByCode = async (productCode) => {
  try {
    const product = await Product.findOne({ productCode });
    return product;
  } catch (error) {
    throw error;
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    const { productName, productType } = productData;

    // Validate product type
    if (!['Top', 'Bottom'].includes(productType)) {
      throw new Error('Invalid product type. Must be Top or Bottom');
    }

    // Check if product with same name exists
    const existingProduct = await Product.findOne({
      productName: { $regex: new RegExp(`^${productName}$`, 'i') }
    });

    if (existingProduct) {
      throw new Error('Product with this name already exists');
    }

    const product = new Product({
      productName,
      productType,
    });

    await product.save();
    return product;
  } catch (error) {
    throw error;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const { productName, productType } = productData;

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Validate product type if provided
    if (productType && !['Top', 'Bottom'].includes(productType)) {
      throw new Error('Invalid product type. Must be Top or Bottom');
    }

    // Check for duplicate product name
    if (productName) {
      const duplicateProduct = await Product.findOne({
        productName: { $regex: new RegExp(`^${productName}$`, 'i') },
        _id: { $ne: id }
      });

      if (duplicateProduct) {
        throw new Error('Product with this name already exists');
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        productName: productName || existingProduct.productName,
        productType: productType || existingProduct.productType,
      },
      { new: true, runValidators: true }
    );

    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    await product.deleteOne();
    return { message: 'Product deleted successfully' };
  } catch (error) {
    throw error;
  }
};

// Count products by type
export const getProductStats = async () => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$productType',
          count: { $sum: 1 },
        },
      },
    ]);
    return stats;
  } catch (error) {
    throw error;
  }
};