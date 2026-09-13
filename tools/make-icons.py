#!/usr/bin/env python3
"""Generate PNG icons with stdlib only. Runs locally or in CI — never on GitHub Pages."""
import binascii, os, struct, zlib

BG, CIRCLE, FG = (0x15, 0x17, 0x16), (0x26, 0x29, 0x28), (0xE8, 0xEA, 0xE9)

def chunk(typ, data):
    return struct.pack('>I', len(data)) + typ + data + struct.pack('>I', binascii.crc32(typ + data) & 0xFFFFFFFF)

def png(size, pixel):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(pixel(x, y))
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr)
            + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))

def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    t = max(0.0, min(1.0, (wx * vx + wy * vy) / (vx * vx + vy * vy or 1)))
    dx, dy = px - (ax + t * vx), py - (ay + t * vy)
    return (dx * dx + dy * dy) ** 0.5

def make(size, maskable=False):
    rc, c, rcirc, w = 0.22 * size, size / 2.0, 0.30 * size, 0.082 * size
    a1, a2, a3 = (0.355*size, 0.515*size), (0.457*size, 0.617*size), (0.645*size, 0.406*size)
    corners = ((rc, rc), (size-1-rc, rc), (rc, size-1-rc), (size-1-rc, size-1-rc))
    def inside_rounded(x, y):
        if rc <= x <= size-1-rc or rc <= y <= size-1-rc:
            return True
        return any((x-cx)**2 + (y-cy)**2 <= rc*rc for cx, cy in corners)
    def pixel(x, y):
        if not maskable and not inside_rounded(x, y):
            return (0, 0, 0, 0)
        col = CIRCLE if (x-c)**2 + (y-c)**2 <= rcirc**2 else BG
        if min(seg_dist(x, y, *a1, *a2), seg_dist(x, y, *a2, *a3)) <= w / 2:
            col = FG
        return col + (255,)
    return pixel

if __name__ == '__main__':
    os.makedirs('icons', exist_ok=True)
    for name, size, mask in (('icon-192.png', 192, False), ('icon-512.png', 512, False), ('icon-maskable-512.png', 512, True)):
        with open(os.path.join('icons', name), 'wb') as f:
            f.write(png(size, make(size, mask)))
        print('wrote icons/' + name)
