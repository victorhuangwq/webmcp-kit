import { defineTool, jsonContent } from 'webmcp-kit';
import { enableDevMode } from 'webmcp-kit/devtools';
import { z } from 'zod';

// Enable the dev panel
enableDevMode();

// ============================================================================
// Pizza Shop State
// ============================================================================

interface Pizza {
  id: string;
  name: string;
  description: string;
  price: number;
  toppings: string[];
}

interface CartItem {
  pizza: Pizza;
  quantity: number;
  size: 'small' | 'medium' | 'large';
}

const menu: Pizza[] = [
  {
    id: 'margherita',
    name: 'Margherita',
    description: 'Classic tomato sauce with fresh mozzarella and basil',
    price: 12.99,
    toppings: ['tomato sauce', 'mozzarella', 'basil'],
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    description: 'Spicy pepperoni with melted cheese',
    price: 14.99,
    toppings: ['tomato sauce', 'mozzarella', 'pepperoni'],
  },
  {
    id: 'hawaiian',
    name: 'Hawaiian',
    description: 'Ham and pineapple on a cheese base',
    price: 13.99,
    toppings: ['tomato sauce', 'mozzarella', 'ham', 'pineapple'],
  },
  {
    id: 'veggie',
    name: 'Veggie Supreme',
    description: 'Fresh vegetables with olive oil',
    price: 13.99,
    toppings: ['tomato sauce', 'mozzarella', 'bell peppers', 'mushrooms', 'onions', 'olives'],
  },
];

let cart: CartItem[] = [];

const sizeMultipliers = {
  small: 0.8,
  medium: 1.0,
  large: 1.3,
};

function updateCartDisplay() {
  const display = document.getElementById('cart-display');
  if (!display) return;

  if (cart.length === 0) {
    display.textContent = 'Your cart is empty. Use the tools to add items!';
    return;
  }

  const total = cart.reduce(
    (sum, item) => sum + item.pizza.price * sizeMultipliers[item.size] * item.quantity,
    0
  );

  display.innerHTML = cart
    .map(
      (item) =>
        `<div>${item.quantity}x ${item.pizza.name} (${item.size}) - $${(
          item.pizza.price *
          sizeMultipliers[item.size] *
          item.quantity
        ).toFixed(2)}</div>`
    )
    .join('') + `<div style="margin-top: 12px; font-weight: bold;">Total: $${total.toFixed(2)}</div>`;
}

// ============================================================================
// WebMCP Tools
// ============================================================================

// Tool: Get Menu
const getMenuTool = defineTool({
  name: 'getMenu',
  description: 'Get the pizza menu with all available pizzas, prices, and toppings',
  inputSchema: z.object({}),
  execute: async () => {
    return jsonContent({
      pizzas: menu.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        toppings: p.toppings,
      })),
      sizes: ['small', 'medium', 'large'],
      note: 'Prices shown are for medium size. Small is 20% off, large is 30% more.',
    });
  },
});

// Tool: Add to Cart
const addToCartTool = defineTool({
  name: 'addToCart',
  description: 'Add a pizza to the shopping cart',
  inputSchema: z.object({
    pizzaId: z.string().describe('The pizza ID from the menu (e.g., "margherita", "pepperoni")'),
    quantity: z.number().min(1).max(10).describe('Number of pizzas to add (1-10)'),
    size: z.enum(['small', 'medium', 'large']).optional().describe('Pizza size (defaults to medium)'),
  }),
  execute: async ({ pizzaId, quantity, size = 'medium' }) => {
    const pizza = menu.find((p) => p.id === pizzaId);
    if (!pizza) {
      return `Pizza "${pizzaId}" not found. Available: ${menu.map((p) => p.id).join(', ')}`;
    }

    // Check if already in cart
    const existingItem = cart.find((item) => item.pizza.id === pizzaId && item.size === size);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ pizza, quantity, size });
    }

    updateCartDisplay();

    const itemTotal = pizza.price * sizeMultipliers[size] * quantity;
    return `Added ${quantity}x ${pizza.name} (${size}) to cart. Item total: $${itemTotal.toFixed(2)}`;
  },
});

// Tool: Get Cart
const getCartTool = defineTool({
  name: 'getCart',
  description: 'Get the current shopping cart contents and total',
  inputSchema: z.object({}),
  execute: async () => {
    if (cart.length === 0) {
      return jsonContent({ items: [], total: 0, message: 'Cart is empty' });
    }

    const items = cart.map((item) => ({
      pizza: item.pizza.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.pizza.price * sizeMultipliers[item.size],
      subtotal: item.pizza.price * sizeMultipliers[item.size] * item.quantity,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return jsonContent({ items, total: parseFloat(total.toFixed(2)) });
  },
});

// Tool: Clear Cart
const clearCartTool = defineTool({
  name: 'clearCart',
  description: 'Remove all items from the cart',
  inputSchema: z.object({}),
  execute: async () => {
    cart = [];
    updateCartDisplay();
    return 'Cart cleared!';
  },
});

// Tool: Checkout
const checkoutTool = defineTool({
  name: 'checkout',
  description: 'Complete the order and checkout. Requires user confirmation.',
  inputSchema: z.object({
    deliveryAddress: z.string().optional().describe('Delivery address (optional for pickup)'),
    paymentMethod: z.enum(['card', 'cash']).optional().describe('Payment method'),
  }),
  execute: async ({ deliveryAddress, paymentMethod = 'card' }, agent) => {
    if (cart.length === 0) {
      return 'Cannot checkout with an empty cart. Add some pizzas first!';
    }

    const total = cart.reduce(
      (sum, item) => sum + item.pizza.price * sizeMultipliers[item.size] * item.quantity,
      0
    );

    // Request user confirmation
    const { confirmed } = await agent.requestUserInteraction({
      prompt: `Complete order for $${total.toFixed(2)}?\n\nItems:\n${cart
        .map((item) => `- ${item.quantity}x ${item.pizza.name} (${item.size})`)
        .join('\n')}\n\nPayment: ${paymentMethod}${deliveryAddress ? `\nDelivery: ${deliveryAddress}` : ' (pickup)'}`,
      type: 'confirmation',
    });

    if (!confirmed) {
      return 'Order cancelled.';
    }

    // Clear cart and confirm
    const orderNumber = Math.random().toString(36).substring(2, 8).toUpperCase();
    cart = [];
    updateCartDisplay();

    return jsonContent({
      status: 'confirmed',
      orderNumber,
      total: parseFloat(total.toFixed(2)),
      estimatedTime: '25-35 minutes',
      message: `Thank you! Your order #${orderNumber} has been placed.`,
    });
  },
});

// Register all tools
getMenuTool.register();
addToCartTool.register();
getCartTool.register();
clearCartTool.register();
checkoutTool.register();

console.log('🍕 Pizza Shop tools registered! Open the WebMCP DevTools panel to interact.');
