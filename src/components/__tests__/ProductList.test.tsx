import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductList } from '../ProductList';

interface MockProduct {
  id: string;
  sku: string;
  barcode: string;
  quantity: number;
  inventory_quantity: number;
}

describe('ProductList', () => {
  const mockProducts: MockProduct[] = [
    {
      id: '1',
      sku: 'SKU001',
      barcode: '123456789',
      quantity: 1,
      inventory_quantity: 10
    }
  ];

  const mockMultipleProducts: MockProduct[] = [
    {
      id: '1',
      sku: 'SKU001',
      barcode: '123456789',
      quantity: 1,
      inventory_quantity: 10
    },
    {
      id: '2',
      sku: 'SKU002',
      barcode: '987654321',
      quantity: 2,
      inventory_quantity: 5
    }
  ];

  const mockOnQuantityChange = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza corretamente', () => {
    render(
      <ProductList
        products={mockProducts}
        onQuantityChange={mockOnQuantityChange}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('SKU001')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('renderiza corretamente com lista vazia', () => {
    render(
      <ProductList
        products={[]}
        onQuantityChange={mockOnQuantityChange}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.queryByText('SKU001')).not.toBeInTheDocument();
  });

  it('renderiza corretamente com múltiplos produtos', () => {
    render(
      <ProductList
        products={mockMultipleProducts}
        onQuantityChange={mockOnQuantityChange}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('SKU001')).toBeInTheDocument();
    expect(screen.getByText('SKU002')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
  });

  it('chama onQuantityChange quando a quantidade é alterada', () => {
    render(
      <ProductList
        products={mockProducts}
        onQuantityChange={mockOnQuantityChange}
        onRemove={mockOnRemove}
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '2' } });

    expect(mockOnQuantityChange).toHaveBeenCalledWith('1', 2);
  });

  it('não permite quantidade negativa', () => {
    render(
      <ProductList
        products={mockProducts}
        onQuantityChange={mockOnQuantityChange}
        onRemove={mockOnRemove}
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-1' } });

    expect(mockOnQuantityChange).not.toHaveBeenCalled();
  });

  it('não permite quantidade maior que o estoque', () => {
    render(
      <ProductList
        products={mockProducts}
        onQuantityChange={mockOnQuantityChange}
        onRemove={mockOnRemove}
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '11' } });

    expect(mockOnQuantityChange).not.toHaveBeenCalled();
  });

  it('chama onRemove quando o botão de remover é clicado', () => {
    render(
      <ProductList
        products={mockProducts}
        onQuantityChange={mockOnQuantityChange}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByText('Remover');
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });
}); 