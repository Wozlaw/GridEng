import math
import numpy as np
try:
    import matplotlib as mpl
    import matplotlib.pyplot as plt
except ModuleNotFoundError:  # optional dependency for local plotting/debugging
    mpl = None
    plt = None

try:
    from .GreekLetters import gl
except ImportError:
    from GreekLetters import gl


def _require_matplotlib():
    if mpl is None or plt is None:
        raise ModuleNotFoundError(
            "matplotlib is required to use Crossection plotting methods"
        )
    return mpl, plt


class Crossection:
    '''
    Класс для расчета параметров профиля
        Свойства:
            cacheProps - флаг кэширования параметров профиля
            axis - наименование осей профиля (XY (по умолчанию), XZ, YX, YZ, ZX, ZY)
            name - наименование профиля
            res - разрешение расчетного пространства (масштаб), мм
            h - высота расчетного пространства
            b - ширина расчетного пространства
            arr - массив значений расчетного пространства

        TODO: дописать все методы и свойства...

    '''

    def __init__(self, h=1, b=1, res=None, axis='XY', name='', cacheProps: bool = True):
        '''
        Инициализация расчетного пространства
            Параметры:
                h - высота расчетного пространства
                b - ширина расчетного пространства
                axis - наименование осей профиля (XY (по умолчанию), XZ, YX, YZ, ZX, ZY)
                name - наименование профиля
        '''
        self._cache = {}
        self.cacheProps = cacheProps
        if res == None:
            res = np.mean([h, b]) / 500
        self.res = res
        self.h = math.ceil(h / res)
        self.b = math.ceil(b / res)
        self.arr = np.zeros([self.h, self.b])
        self.setAxis(axis)
        if name == '':
            self.name = 'default'
        else:
            self.name = name

    def setAxis(self, axis):
        if axis not in ['XY', 'XZ', 'YX', 'YZ', 'ZX', 'ZY']:
            raise ValueError('Недопустимое значение осей')
        self.axis = axis
        self._cache.clear()

    def newShape(self, h, b, res=None):
        res = res or np.mean([h, b]) / 500
        self.res = res
        self.h = math.ceil(h / res)
        self.b = math.ceil(b / res)
        self.arr = np.zeros([self.h, self.b])
        self.name = ''
        self._cache.clear()

    def LShape(self, h, t, R=0, r=0, b=None, res=None):
        ''' 
        Угловой профиль
            Параметры:
                h - высота профиля
                t - толщина стенки профиля
                b - ширина профиля (если не задана, то равняется его высоте h)
                R - радиус внутреннего угла профиля (если не задан, то равняется 0)
                r - радиус полки (если не задан, то равняется 0)
                res - разрешение расчетного пространства (масштаб), мм
        '''
        b = b or h
        if h <= 0 or b <= 0 or t <= 0 or r < 0 or R < 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if R > min(h, b) - t - r:
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла (R)')
        if r > t:
            raise ValueError('Недопустимое значение радиуса полки (r)')
        if h <= t + r:
            raise ValueError('Недопустимое значение высоты профиля (h)')
        if b <= t + r:
            raise ValueError('Недопустимое значение ширины профиля (b)')
        self.newShape(h, b, res=res)
        self.addRect(h - r, t, 0, 0)
        self.addRect(t, b - r, 0, 0)
        self.addRect(R, R, t, t)
        self.subCircle(R, t, t)
        self.addCircle(r, t - 2*r, h - 2*r)
        self.addRect(r, t - r, 0, h - r)
        self.addCircle(r, b - 2*r, t - 2*r)
        self.addRect(t - r, r, b - r, 0)
        self.fillSpaces()
        if h == b:
            self.name = f'L{h}x{t}'
        else:
            self.name = f'L{h}x{b}x{t}'
        return self

    def LBendShape(self, h, t, R=0, b=None, res=None):
        ''' 
        Угловой гнутый профиль
            Параметры:
                h - высота профиля
                t - толщина стенки профиля
                b - ширина профиля (если не задана, то равняется его высоте h)
                R - радиус гиба (если не задан, то равняется 0)
                res - разрешение расчетного пространства (масштаб), мм
        '''
        b = b or h
        if h <= 0 or b <= 0 or t <= 0 or R < 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if R > min(h, b) or R < t:
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла (R)')
        if h <= R:
            raise ValueError('Недопустимое значение высоты профиля (h)')
        if b <= R:
            raise ValueError('Недопустимое значение ширины профиля (b)')
        self.newShape(h, b, res=res)
        self.addRect(h - R, t, 0, R)
        self.addRect(t, b - R, R, 0)
        self.addCircle(R)
        self.subCircle(R - t, t, t)
        self.subRect(2 * R, 2 * R, t, R)
        self.subRect(2 * R, 2 * R, R, t)
        self.fillSpaces()
        if h == b:
            self.name = f'LBand{h}x{t}'
        else:
            self.name = f'LBand{h}x{b}x{t}'
        return self

    def HexShape(self, h, res=None):
        ''' 
        Шестиугольный профиль
            Параметры:
                h - высота профиля
                res - разрешение расчетного пространства (масштаб), мм
        '''
        if h <= 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        d = 2 * h / math.sqrt(3)
        t = d / 2
        c = math.sqrt(math.pow(t, 2) - math.pow(h / 2, 2))
        self.newShape(h, d, res=res)
        self.addRect(h, d, 0, 0)
        self.subTriangle(h / 2, c, 0, 0, flipX=True, flipY=False)
        self.subTriangle(h / 2, c, 0, h / 2, flipX=True, flipY=True)
        self.subTriangle(h / 2, c, d - c, 0, flipX=False, flipY=False)
        self.subTriangle(h / 2, c, d - c, h / 2, flipX=False, flipY=True)
        self.fillSpaces()
        self.name = f'Hex{h}'
        return self

    def RectShape(self, h, b=None, res=None):
        ''' 
        Прямоугольный профиль
            Параметры:
                h - высота профиля
                b - ширина профиля
                res - разрешение расчетного пространства (масштаб), мм
        '''
        b = b or h
        if h <= 0 or b <= 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        self.newShape(h, b, res=res)
        self.addRect(h, b)
        self.fillSpaces()
        if h == b:
            self.name = f'Square{h}'
        else:
            self.name = f'Rect{h}x{b}'
        return self

    def CShape(self, h, b, s, t, R=0, r=0, delta=0.0, res=None):
        '''
        Профиль швеллера
            Параметры:
                h - высота профиля
                b - ширина профиля
                s - толщина стенки профиля
                t - толщина полки профиля
                R - радиус внутреннего закругления
                r - радиус закругления полки
                delta - перекос полки (по ГОСТ от 0.04 до 0.1 для профиля с полкой, по умолчанию 0)
                res - разрешение расчетного пространства (масштаб), мм
        '''
        bt = b - s - R - r
        at = bt * delta
        if h <= 0 or b <= 0 or s <= 0 or r < 0 or R < 0 or delta < 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if delta > 0.1:
            raise ValueError('Недопустимое значение перекоса полки (delta)')
        if h < 2 * t + 2 * R:
            raise ValueError('Недопустимое значение высоты профиля (h)')
        if b < s + R + r:
            raise ValueError('Недопустимое значение ширины профиля (b)')
        if 2 * R > h - 2 * (t + at / 2):
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла профиля (R)')
        if R > b - s - r:
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла профиля (R)')
        if r > t - at / 2:
            raise ValueError('Недопустимое значение радиуса полки профиля (r)')
        if t > (h / 2) - R - at / 2:
            raise ValueError('Недопустимое значение толщины полки профиля (t)')
        if s > b - r - R:
            raise ValueError(
                'Недопустимое значение толщины стенки профиля (s)')
        self.newShape(h / 2, b, res=res)
        self.addRect(h / 2, s)
        self.addRect(t + at / 2, b - r)
        self.subTriangle(at, bt, s + R, t - at / 2, flipX=False, flipY=True)
        self.addRect(at + R + t - at / 2, R, s, 0)
        self.subCircle(R, s, t - at / 2 + at)
        self.addCircle(r, b - 2 * r, (t - at / 2) - 2 * r)
        self.addRect(t - r - at / 2, 2 * r, b - 2 * r, 0)
        addArr = np.flip(self.arr, axis=0)
        self.incraceY(self.h)
        self.arr[0: addArr.shape[0], 0: self.b] = addArr
        self.fillSpaces()
        self.name = f'C{h}x{b}x{s}x{t}'
        return self

    def IShape(self, h, b, s, t, R=0, r=0, delta=0.0, res=None):
        '''
        Профиль двутавра
            Параметры:
                h - высота профиля
                b - ширина профиля
                s - толщина стенки профиля
                t - толщина полки профиля
                R - радиус внутреннего закругления
                r - радиус закругления полки
                delta - перекос полки (по ГОСТ от 0.04 до 0.1 для профиля с полкой, по умолчанию 0)
                res - разрешение расчетного пространства (масштаб), мм
        '''
        bt = (b / 2) - (s / 2) - R - r
        at = bt * delta
        if h <= 0 or b <= 0 or s <= 0 or r < 0 or R < 0 or delta < 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if delta > 0.1:
            raise ValueError('Недопустимое значение перекоса полки (delta)')
        if h < 2 * t + 2 * R:
            raise ValueError('Недопустимое значение высоты профиля (h)')
        if b < s + 2 * R + 2 * r:
            raise ValueError('Недопустимое значение ширины профиля (b)')
        if 2 * R > h - 2 * (t + at / 2):
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла профиля (R)')
        if R > b - s - r:
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла профиля (R)')
        if r > t - at / 2:
            raise ValueError('Недопустимое значение радиуса полки профиля (r)')
        if t > (h / 2) - R - at / 2:
            raise ValueError('Недопустимое значение толщины полки профиля (t)')
        if s > b - r - R:
            raise ValueError(
                'Недопустимое значение толщины стенки профиля (s)')
        self.newShape(h / 2, b / 2, res=res)
        self.addRect(h / 2, s / 2)
        self.addRect(t + at / 2, b / 2 - r)
        self.subTriangle(at, bt, (s / 2) + R, t - at /
                         2, flipX=False, flipY=True)
        self.addRect(at + R + t - at / 2, R, s / 2, 0)
        self.subCircle(R, s / 2, t - at / 2 + at)
        self.addCircle(r, (b / 2) - 2 * r, (t - at / 2) - 2 * r)
        self.addRect(t - r - at / 2, 2 * r, (b / 2) - 2 * r, 0)
        addArr = np.flip(self.arr, axis=0)
        self.incraceY(self.h)
        self.arr[0: addArr.shape[0], 0: self.b] = addArr
        tempArr = self.arr.copy()
        self.arr = np.flip(tempArr, axis=1)
        self.incraceX(self.b)
        self.arr[0: self.h, tempArr.shape[1]:] = tempArr
        self.fillSpaces()
        self.name = f'I{h}x{b}x{s}x{t}'
        return self

    def TShape(self, h, b, s, t, R=0, r=0, p=0, delta=0.0, res=None):
        '''
        Профиль тавра
            Параметры:
                h - высота профиля
                b - ширина профиля
                s - толщина стенки профиля
                t - толщина полки профиля
                R - радиус внутреннего закругления
                r - радиус закругления полки
                p - радиус закругления стенки
                delta - перекос полки (по ГОСТ от 0.04 до 0.1 для профиля с полкой, по умолчанию 0)
                res - разрешение расчетного пространства (масштаб), мм
        '''
        bt = (b / 2) - (s / 2) - R - r
        at = bt * delta
        if h <= 0 or b <= 0 or s <= 0 or r < 0 or R < 0 or p < 0 or delta < 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if delta > 0.1:
            raise ValueError('Недопустимое значение перекоса полки (delta)')
        if h < 2 * t + 2 * R + p:
            raise ValueError('Недопустимое значение высоты профиля (h)')
        if b < s + 2 * R + 2 * r:
            raise ValueError('Недопустимое значение ширины профиля (b)')
        if 2 * R > h - 2 * (t + at / 2):
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла профиля (R)')
        if R > b - s - r:
            raise ValueError(
                'Недопустимое значение радиуса внутреннего угла профиля (R)')
        if r > t - at / 2:
            raise ValueError('Недопустимое значение радиуса полки профиля (r)')
        if t > (h / 2) - R - at / 2:
            raise ValueError('Недопустимое значение толщины полки профиля (t)')
        if s > b - r - R:
            raise ValueError(
                'Недопустимое значение толщины стенки профиля (s)')
        if 2 * p > s:
            raise ValueError(
                'Недопустимое значение радиуса закругления стенки профиля (p)')
        self.newShape(h, b / 2, res=res)
        self.addRect(h - p, s / 2)
        self.addCircle(p, (s / 2) - (2 * p), h - (p * 2))
        self.addRect(2 * p, s / 2 - p, 0,  h - (p * 2))
        self.addRect(t + at / 2, b / 2 - r)
        self.subTriangle(at, bt, (s / 2) + R, t - at /
                         2, flipX=False, flipY=True)
        self.addRect(at + R + t - at / 2, R, s / 2, 0)
        self.subCircle(R, s / 2, t - at / 2 + at)
        self.addCircle(r, (b / 2) - 2 * r, (t - at / 2) - 2 * r)
        self.addRect(t - r - at / 2, 2 * r, (b / 2) - 2 * r, 0)
        tempArr = self.arr.copy()
        self.arr = np.flip(tempArr, axis=1)
        self.incraceX(self.b)
        self.arr[0: self.h, tempArr.shape[1]:] = tempArr
        self.fillSpaces()
        self.name = f'T{h}x{b}x{s}x{t}'
        return self

    def CircleShape(self, D, res=None):
        '''
        Круглый профиль
            Параметры:
                D - радиус профиля
                res - разрешение расчетного пространства (масштаб), мм
        '''
        if D <= 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')

        self.newShape(D, D, res=res)
        self.addCircle(D / 2)
        self.fillSpaces()
        self.name = f'O{D}'
        return self

    def PipeShape(self, D, t, res=None):
        '''
        Профиль трубы
            Параметры:
                D - диаметр трубы
                t - толщина стенки трубы
                res - разрешение расчетного пространства (масштаб), мм
        '''
        if D <= 0 or t <= 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if 2 * t >= D:
            raise ValueError('Недопустимое значение толщины стенки трубы (t)')
        self.newShape(D, D, res=res)
        self.addCircle(D / 2)
        self.subCircle(D / 2 - t, t, t)
        self.fillSpaces()
        self.name = f'Pipe{D}x{t}'
        return self

    def SquarePipeShape(self, h, t, r=0, b=None, res=None):
        ''' 
        Профиль прямоугольной трубы
            Параметры:
                h - высота профиля
                t - толщина стенки профиля
                r - радиус скругления угловых частей профиля (если не задан, то равняется 0)
                b - ширина профиля (если не задана, то равняется его высоте)
                res - разрешение расчетного пространства (масштаб), мм
        '''
        b = b or h
        if h <= 0 or t <= 0 or r < 0 or b <= 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if h < min(2 * r, 2 * t):
            raise ValueError('Недопустимое значение высоты профиля (h)')
        if b < min(2 * r, 2 * t):
            raise ValueError('Недопустимое значение ширины профиля (b)')
        if r > t:
            raise ValueError(
                'Недопустимое значение радиуса скругления угловых частей профиля (r)')
        if 2 * t > h or 2 * t > b:
            raise ValueError(
                'Недопустимое значение толщины стенки профиля (t)')
        self.newShape(h, b, res=res)
        self.addRect(h, b - 2 * r, r, 0)
        self.addRect(h - 2 * r, b, 0, r)
        self.addCircle(r, 0, 0)
        self.addCircle(r, 0, h - 2 * r)
        self.addCircle(r, b - 2 * r, 0)
        self.addCircle(r, b - 2 * r, h - 2 * r)
        rin = r - t
        if rin < 0:
            rin = 0
        self.subCircle(rin, t, t)
        self.subCircle(rin, t, h - 2 * rin - t)
        self.subCircle(rin, b - 2 * rin - t, t)
        self.subCircle(rin, b - 2 * rin - t, h - 2 * rin - t)
        self.subRect(h - 2 * t, b - 2 * r, r, t)
        self.subRect(h - 2 * r, b - 2 * t, t, r)
        self.fillSpaces()
        if h == b:
            self.name = f'SPipe{h}x{t}'
        else:
            self.name = f'SPipe{h}x{b}x{t}'
        return self

    def ShaftCircleShape(self, D, b, h, res=None):
        '''
        Профиль поперечного сечения вала со шпонкой
            Параметры:
                D - диаметр вала
                b - ширина шпоночного паза
                h - высота шпоночного паза
                res - разрешение расчетного пространства (масштаб), мм
        '''
        if D <= 0 or b <= 0 or h <= 0:
            raise ValueError(
                'Значения параметров профиля должны быть больше нуля')
        if b > D / 2:
            raise ValueError(
                'Недопустимое значение ширины шпоночного паза (b)')
        if h > D / 2:
            raise ValueError(
                'Недопустимое значение высоты шпоночного паза (h)')

        self.newShape(D, D, res=res)
        self.addCircle(D / 2)
        self.subRect(h, b, D/2 - b/2, D - h)
        self.fillSpaces()
        self.name = f'O{D}|Shaft{b}x{h}'
        return self

    def fillSpaces(self):
        '''
        Заполняет пустые строки расчетного пространства (по аналогии с соедними элементами)
        возможные ввиду округления геометрии до целого
        '''
        ind = np.where(self.arr.sum(axis=0) == 0)
        if len(ind[0]) > 0:
            for i in ind[0]:
                if i == 0:
                    self.arr[:, i] = self.arr[:, i+1]
                else:
                    self.arr[:, i] = self.arr[:, i-1]
        ind = np.where(self.arr.sum(axis=1) == 0)
        if len(ind[0]) > 0:
            for i in ind[0]:
                if i == 0:
                    self.arr[i, :] = self.arr[i+1, :]
                else:
                    self.arr[i, :] = self.arr[i-1, :]

    def incraceX(self, dx):
        addArr = np.zeros([self.h, dx])
        self.b = self.b + dx
        self.arr = np.concatenate([self.arr, addArr], axis=1)

    def incraceY(self, dy):
        addArr = np.zeros([dy, self.b])
        self.h = self.h + dy
        self.arr = np.concatenate([addArr, self.arr], axis=0)

    def addRect(self, h, b, x0=0, y0=0):
        '''
        Добавление прямоугольника в расчетное пространство
            Параметры:
                h - высота прямоугольника
                b - ширина прямоугольника
                x0 - координата по оси x левого нижнего угла прямоугольника
                y0 - координата по оси y левого нижнего угла прямоугольника
        '''
        H = round(h / self.res)
        B = round(b / self.res)
        X0 = round(x0 / self.res)
        Y0 = round(y0 / self.res)
        if Y0 + H > self.h:
            self.incraceY(H - (self.h - Y0))
        if X0 + B > self.b:
            self.incraceX(B - (self.b - X0))
        if X0 >= 0:
            self.arr[self.h - Y0 - H: self.h - Y0, X0: X0 + B] = 1
        elif B + X0 > 0:
            self.arr[self.h - Y0 - H: self.h - Y0, 0: B + X0] = 1

    def subRect(self, h, b, x0=0, y0=0):
        '''
        Удаление прямоугольника из расчетного пространства
            Параметры:
                h - высота прямоугольника
                b - ширина прямоугольника
                x0 - координата по оси x левого нижнего угла прямоугольника
                y0 - координата по оси y левого нижнего угла прямоугольника
        '''
        H = round(h / self.res)
        B = round(b / self.res)
        X0 = round(x0 / self.res)
        Y0 = round(y0 / self.res)
        if Y0 + H > self.h:
            self.incraceY(H - (self.h - Y0))
        if X0 + B > self.b:
            self.incraceX(B - (self.b - X0))
        if X0 >= 0:
            self.arr[self.h - Y0 - H: self.h - Y0, X0: X0 + B] = 0
        elif B + X0 > 0:
            self.arr[self.h - Y0 - H: self.h - Y0, 0: B + X0] = 0

    def addTriangle(self, h, b, x0=0, y0=0, flipX=False, flipY=False):
        ''' 
        Добавление прямоугольного треугольника в расчетное пространство
            Параметры:
                h - высота треугольника
                b - ширина треугольника
                x0 - координата по оси x левого нижнего угла треугольника
                y0 - координата по оси y левого нижнего угла треугольника
                flipX - отражение по оси x
                flipY - отражение по оси y
        '''
        H = round(h / self.res)
        B = round(b / self.res)
        X0 = round(x0 / self.res)
        Y0 = round(y0 / self.res)
        if Y0 + H > self.h:
            self.incraceY(H - (self.h - Y0))
        if X0 + B > self.b:
            self.incraceX(B - (self.b - X0))
        tanA = H / B
        X = np.arange(1, B + 1)
        X[X < 1] = 1
        if flipX:
            X = np.flip(X)
        Y = np.array([np.flip(np.arange(1, H + 1))]).T
        Y[Y < 1] = 1
        if flipY:
            Y = np.flip(Y)
        tempArr = (np.ones([H, B]) * Y) / (np.ones([H, B]) * X)
        tempArr = np.where(tempArr < tanA, tempArr, 0)
        tempArr[tempArr > 0] = 1
        if X0 < 0:
            tempArr = tempArr[:, -X0:]
        if Y0 < 0:
            tempArr = tempArr[:H + Y0, :]
        if X0 >= 0:
            self.arr[self.h - Y0 - H: self.h - Y0, X0: X0 + B] = tempArr
        elif B + X0 > 0:
            self.arr[self.h - Y0 - H: self.h - Y0, 0: B + X0] = tempArr

    def subTriangle(self, h, b, x0=0, y0=0, flipX=False, flipY=False):
        ''' 
        Удаление прямоугольного треугольника из расчетного пространства
            Параметры:
                h - высота треугольника
                b - ширина треугольника
                x0 - координата по оси x левого нижнего угла треугольника
                y0 - координата по оси y левого нижнего угла треугольника
                flipX - отражение по оси x
                flipY - отражение по оси y
        '''
        H = round(h / self.res)
        B = round(b / self.res)
        X0 = round(x0 / self.res)
        Y0 = round(y0 / self.res)
        if Y0 + H > self.h:
            self.incraceY(H - (self.h - Y0))
        if X0 + B > self.b:
            self.incraceX(B - (self.b - X0))
        tanA = H / B
        X = np.arange(1, B + 1)
        X[X < 1] = 1
        if flipX:
            X = np.flip(X)
        Y = np.array([np.flip(np.arange(1, H + 1))]).T
        Y[Y < 1] = 1
        if flipY:
            Y = np.flip(Y)
        tempArr = (np.ones([H, B]) * Y) / (np.ones([H, B]) * X)
        tempArr = np.where(tempArr < tanA, tempArr, 0)
        tempArr[tempArr > 0] = 1
        if X0 < 0:
            tempArr = tempArr[:, -X0:]
        if Y0 < 0:
            tempArr = tempArr[:H + Y0, :]
        if X0 >= 0:
            self.arr[self.h - Y0 - H: self.h - Y0, X0: X0 + B] -= tempArr
        elif B + X0 > 0:
            self.arr[self.h - Y0 - H: self.h - Y0, 0: B + X0] -= tempArr

    def addCircle(self, r, x0=0, y0=0):
        ''' 
        Добавление круга в расчетное пространство
            Параметры:
                r - радиус круга
                x0 - координата по оси x левого нижнего угла описаного прямоугольника
                y0 - координата по оси y левого нижнего угла описаного прямоугольника
        '''
        H = round(r * 2 / self.res)
        B = round(r * 2 / self.res)
        X0 = round(x0 / self.res)
        Y0 = round(y0 / self.res)
        if X0 >= 0:
            B = B + X0
        if B > self.b:
            self.incraceX(B - self.b)
        if Y0 >= 0:
            H = H + Y0
        if H > self.h:
            self.incraceY(H - self.h)
        R = r / self.res
        X = np.arange(1, B + 1) - X0 - R
        if H > self.h:
            self.incraceY(H - self.h)
        R = r / self.res
        X = np.arange(1, B + 1) - X0 - R
        Y = np.array([np.flip(np.arange(1, H + 1))]).T - R - Y0
        tempArr = np.ones([H, B]) * np.pow(Y, 2) + \
            np.ones([H, B]) * np.pow(X, 2)
        tempArr[tempArr == 0] = 1
        tempArr = np.where(tempArr <= math.pow(R, 2), tempArr, 0)
        self.arr[self.h - H: self.h, 0: B] += tempArr
        self.arr[self.arr > 0] = 1

    def subCircle(self, r, x0=0, y0=0):
        ''' 
        Удаление круга из расчетного пространства
            Параметры:
                r - радиус круга
                x0 - координата по оси x левого нижнего угла описаного прямоугольника
                y0 - координата по оси y левого нижнего угла описаного прямоугольника
        '''
        H = round(r * 2 / self.res)
        B = round(r * 2 / self.res)
        X0 = round(x0 / self.res)
        Y0 = round(y0 / self.res)
        if X0 >= 0:
            B = B + X0
        if B > self.b:
            self.incraceX(B - self.b)
        if Y0 >= 0:
            H = H + Y0
        if H > self.h:
            self.incraceY(H - self.h)
        R = r / self.res
        X = np.arange(1, B + 1) - X0 - R
        if H > self.h:
            self.incraceY(H - self.h)
        R = r / self.res
        X = np.arange(1, B + 1) - X0 - R
        Y = np.array([np.flip(np.arange(1, H + 1))]).T - R - Y0
        tempArr = np.ones([H, B]) * np.pow(Y, 2) + \
            np.ones([H, B]) * np.pow(X, 2)
        tempArr[tempArr == 0] = 1
        tempArr = np.where(tempArr <= math.pow(R, 2), tempArr, 0)
        tempArr[tempArr > 0] = 1
        self.arr[self.h - H: self.h, 0: B] -= tempArr
        self.arr[self.arr < 0] = 0

    def addHole(self, d, c0=0, axis='X'):
        '''
        Добавление отверстия в расчетное пространство
            Параметры:
                d - диаметр отверстия
                x0 - координата по оси x левого нижнего угла описаного прямоугольника
                y0 - координата по оси y левого нижнего угла описаного прямоугольника
                axis - направление оси (X - ось Х, Y - ось У, XY - ось XY)
        '''
        if axis not in ['X', 'Y', 'XY']:
            raise ValueError('Недопустимое значение оси')
        self._cache = {}
        if axis == 'X':
            self.subRect(self.h * self.res, d, c0 - d / 2, 0)
        elif axis == 'Y':
            self.subRect(d, self.b * self.res, 0, c0 - d / 2)
        elif axis == 'XY':
            self.subRect(self.h * self.res, d, c0 - d / 2, 0)
            self.subRect(d, self.b * self.res, 0, c0 - d / 2)
        return self

    @property
    def literals(self):
        """
            Получение литералов осей (результат кешируется).
            a - ось абсцисс
            b - ось ординат
            с - ось аппликат (ось стержня)
        """
        literals = self._cache.get('literals', None)
        if literals is None:
            literals = self.getLiterals()
            if self.cacheProps:
                self._cache['literals'] = literals
        return literals

    @property
    def aDim(self):
        aDim = self._cache.get('aDim', None)
        if aDim is None:
            aDim = self.getAdim()
            if self.cacheProps:
                self._cache['aDim'] = aDim
        return aDim

    @property
    def bDim(self):
        bDim = self._cache.get('bDim', None)
        if bDim is None:
            bDim = self.getBdim()
            if self.cacheProps:
                self._cache['bDim'] = bDim
        return bDim

    @property
    def centerOfMass(self):
        '''
        Координаты центра масс поперечного сечения (результат кешируется)
        '''
        COM = self._cache.get('COM', None)
        if COM is None:
            COM = self.getCenterOfMass()
            if self.cacheProps:
                self._cache['COM'] = COM
        return COM

    @property
    def crossectionMoment(self):
        '''
        Статические моменты поперечного сечения (результат кешируется)
        '''
        SM = self._cache.get('SM', None)
        if SM is None:
            SM = self.getCrossectionMoment()
            if self.cacheProps:
                self._cache['SM'] = SM
        return SM

    @property
    def inertionMoment(self):
        '''
        Моменты инерции поперечного сечения относительно осей проходящих через центр масс (результат кешируется)
        '''
        MI = self._cache.get('MI', None)
        if MI is None:
            MI = self.getInertionMoment()
            if self.cacheProps:
                self._cache['MI'] = MI
        return MI

    @property
    def inertionRadius(self):
        '''
        Радиусы инерции поперечного сечения (результат кешируется)
        '''
        IR = self._cache.get('IR', None)
        if IR is None:
            IR = self.getInertionRadius()
            if self.cacheProps:
                self._cache['IR'] = IR
        return IR

    @property
    def resistanceMoment(self):
        '''
        Моменты сопротивления поперечного сечения (результат кешируется)
        '''
        RM = self._cache.get('RM', None)
        if RM is None:
            RM = self.getResistanceMoment()
            if self.cacheProps:
                self._cache['RM'] = RM
        return RM

    @property
    def area(self):
        '''
        Площадь поперечного сечения (результат кешируется)
        '''
        area = self._cache.get('area', None)
        if area is None:
            area = self.getArea()
            if self.cacheProps:
                self._cache['area'] = area
        return area

    def getLiterals(self):
        """
            Получение литералов осей.
            a - ось абсцисс
            b - ось ординат
            с - ось аппликат (ось стержня)
        """
        # 'XY':
        Ca = 'Cx'
        Cb = 'Cy'
        Ja = 'Jx'
        Jb = 'Jy'
        ia = 'ix'
        ib = 'iy'
        Sa = 'Sx'
        Sb = 'Sy'
        Wa = 'Wx'
        Wb = 'Wy'
        Ma = 'Mx'
        Mb = 'My'
        Mc = 'Mz'
        Fa = 'Fx'
        Fb = 'Fy'
        Fc = 'Fz'
        if self.axis == 'XZ':
            Ca = 'Cx'
            Cb = 'Cz'
            Ja = 'Jx'
            Jb = 'Jz'
            ia = 'ix'
            ib = 'iz'
            Sa = 'Sx'
            Sb = 'Sz'
            Wa = 'Wx'
            Wb = 'Wz'
            Ma = 'Mx'
            Mb = 'Mz'
            Mc = 'My'
            Fa = 'Fx'
            Fb = 'Fz'
            Fc = 'Fy'
        elif self.axis == 'YX':
            Ca = 'Cy'
            Cb = 'Cx'
            Ja = 'Jy'
            Jb = 'Jx'
            ia = 'iy'
            ib = 'ix'
            Sa = 'Sy'
            Sb = 'Sx'
            Wa = 'Wy'
            Wb = 'Wx'
            Ma = 'My'
            Mb = 'Mx'
            Mc = 'Mz'
            Fa = 'Fy'
            Fb = 'Fx'
            Fc = 'Fz'
        elif self.axis == 'YZ':
            Ca = 'Cy'
            Cb = 'Cz'
            Ja = 'Jy'
            Jb = 'Jz'
            ia = 'iy'
            ib = 'iz'
            Sa = 'Sy'
            Sb = 'Sz'
            Wa = 'Wy'
            Wb = 'Wz'
            Ma = 'My'
            Mb = 'Mz'
            Mc = 'Mx'
            Fa = 'Fy'
            Fb = 'Fz'
            Fc = 'Fx'
        elif self.axis == 'ZX':
            Ca = 'Cz'
            Cb = 'Cx'
            Ja = 'Jz'
            Jb = 'Jx'
            ia = 'iz'
            ib = 'ix'
            Sa = 'Sz'
            Sb = 'Sx'
            Wa = 'Wz'
            Wb = 'Wx'
            Ma = 'Mz'
            Mb = 'Mx'
            Mc = 'My'
            Fa = 'Fz'
            Fb = 'Fx'
            Fc = 'Fy'
        elif self.axis == 'ZY':
            Ca = 'Cz'
            Cb = 'Cy'
            Ja = 'Jz'
            Jb = 'Jy'
            ia = 'iz'
            ib = 'iy'
            Sa = 'Sz'
            Sb = 'Sy'
            Wa = 'Wz'
            Wb = 'Wy'
            Ma = 'Mz'
            Mb = 'My'
            Mc = 'Mx'
            Fa = 'Fz'
            Fb = 'Fy'
            Fc = 'Fx'
        literals = {'Ca': Ca, 'Cb': Cb, 'Ja': Ja, 'Jb': Jb, 'ia': ia, 'ib': ib, 'Sa': Sa,
                    'Sb': Sb, 'Wa': Wa, 'Wb': Wb, 'Ma': Ma, 'Mb': Mb, 'Mc': Mc, 'Fa': Fa, 'Fb': Fb, 'Fc': Fc}

        return literals

    def getAdim(self):
        literals = self.literals
        COM = self.centerOfMass
        aDim = (np.arange(1, self.b + 1) -
                np.ones([self.b]) * COM[literals['Ca']] / self.res) * self.res - self.res / 2
        return aDim

    def getBdim(self):
        literals = self.literals
        COM = self.centerOfMass
        bDim = np.array([(np.flip(np.arange(1, self.h + 1) - np.ones([self.h])
                        * COM[literals['Cb']] / self.res)) * self.res - self.res / 2]).T
        return bDim

    def getCenterOfMass(self):
        '''
        Вычисление координат центра масс поперечного сечения
        '''
        literals = self.literals
        xCoords = np.arange(1, self.b + 1) * self.res
        yCoords = np.array(
            [np.flip(np.arange(1, self.h + 1) * self.res)]).T
        Ca = (self.arr * xCoords * math.pow(self.res, 2) /
              self.area).sum() - self.res / 2
        Cb = (self.arr * yCoords * math.pow(self.res, 2) /
              self.area).sum() - self.res / 2
        COM = {literals['Ca']: float(Ca), literals['Cb']: float(Cb)}
        return COM

    def getCrossectionMoment(self):
        '''
        Вычисление статических моментов поперечного сечения
        '''
        literals = self.literals
        COM = self.centerOfMass
        Sa = COM[literals['Cb']] * self.area
        Sb = COM[literals['Ca']] * self.area
        SM = {literals['Sa']: float(Sa), literals['Sb']: float(Sb)}
        return SM

    def getInertionMoment(self):
        '''
        Вычисление инерционного момента поперечного сечения
        '''
        literals = self.literals
        aDim = self.aDim
        bDim = self.bDim
        Ja = (self.arr * np.pow(bDim, 2)).sum() * math.pow(self.res, 2)
        Jb = (self.arr * np.pow(aDim, 2)).sum() * math.pow(self.res, 2)
        IM = {literals['Ja']: float(Ja), literals['Jb']: float(Jb), 'Jp': float(Ja + Jb)}
        return IM

    def getInertionRadius(self):
        '''
        Вычисление радиусов инерции поперечного сечения
        '''
        literals = self.literals
        IM = self.inertionMoment
        area = self.area
        IR = {literals['ia']: math.sqrt(IM[literals['Ja']] / area),
              literals['ib']:math.sqrt(IM[literals['Jb']] / area)}
        return IR

    def getResistanceMoment(self):
        '''
        Вычисление моментов сопротивления поперечного сечения
        '''
        literals = self.literals
        IM = self.inertionMoment
        b = np.abs(self.aDim) * self.arr
        h = np.abs(self.bDim) * self.arr
        bmax = b.max()
        hmax = h.max()
        rmax = np.hypot(b, h).max()
        RM = {literals['Wa']:float(IM[literals['Ja']] / hmax), literals['Wb']: float(IM[literals['Jb']] / bmax), 'Wp': float(IM['Jp'] / rmax)}
        return RM

    def getNormalTensionMatrix(self, Forces=None):
        ''' 
        Получение матрицы нормальных напряжений
            Параметры:
                Forces - Словарь со значениями сил и моментов по осям, силы в Н, моменты в Нм
            Возвращает:
                Матрицу нормальных напряжений (МПа)
        '''
        if Forces is None:
            Forces = {}
        literals = self.literals
        IM = self.inertionMoment
        Ma = Forces.get(literals['Ma'], 0) * 1e3
        Mb = Forces.get(literals['Mb'], 0) * 1e3
        b = self.aDim
        h = self.bDim
        mask = h != 0
        sigma_a = np.zeros_like(h)
        if Ma != 0:
            np.place(sigma_a, mask, Ma / (IM[literals['Ja']] / h[mask]))
        mask = b != 0
        sigma_b = np.zeros_like(b)
        if Mb != 0:
            np.place(sigma_b, mask, Mb / (IM[literals['Jb']] / b[mask]))
        return sigma_a * self.arr + sigma_b * self.arr + Forces.get(literals['Fc'], 0) * self.arr / self.area

    def getTangetialTensionMatrix(self, Forces=None):
        ''' 
        Получение векторов касательных напряжений при сдвиге
            Параметры:
                Forces - Словарь со значениями сил и моментов по осям, силы в Н
            Возвращает:
                Матрицу касательных напряжений, МПа
        '''
        if Forces is None:
            Forces = {}
        literals = self.literals
        IM = self.inertionMoment
        tau_ca = np.zeros_like(self.arr)
        tau_cb = np.zeros_like(self.arr)
        a = self.aDim
        b = self.bDim

        # Напряжения ca по теореме Журавского
        Fa = Forces.get(literals['Fa'], 0)
        if Fa != 0:
            Sline = (self.arr * math.pow(self.res, 2)).sum(axis=0) * a
            ha = self.arr.sum(axis=0) * self.res
            tau_ca += (Fa * (np.cumsum(Sline) - Sline / 2) * -
                       1 / (IM[literals['Jb']] * ha)) * self.arr

        # Напряжения cb по теореме Журавского
        Fb = Forces.get(literals['Fb'], 0)
        if Fb != 0:
            Sline = (self.arr * math.pow(self.res, 2)).sum(axis=1) * b.T[0]
            by = self.arr.sum(axis=1) * self.res
            tau_cb += np.array([Fb * (np.cumsum(Sline) - Sline / 2) /
                               (IM[literals['Ja']] * by)]).T * self.arr

        # Тангециальные напряжения от чистого кручения
        Mc = Forces.get(literals['Mc'], 0) * 1e3  # Н*мм
        if Mc != 0:
            Xarr = self.arr * a
            Yarr = self.arr * b
            r = np.hypot(Xarr, Yarr)
            mask = r != 0
            sin = np.zeros_like(r)
            cos = np.zeros_like(r)
            np.place(sin, mask, Xarr[mask]/r[mask])
            np.place(cos, mask, Yarr[mask]/r[mask])
            Jp = IM.get('Jp')
            tau = Mc * r / Jp
            tau_ca += tau * cos
            tau_cb += tau * sin

        # NOTE Возвращаем модуль общего касательного напряжения (МПа).
        # Его направление в общем то для дальнейших расчетов не интересно!
        # Напряжения от стесненного кручения на рассчитываются!!!
        return np.hypot(tau_ca, tau_cb)

    def getTensions(self, Forces=None):
        ''' 
        Получение экстремальных значений напряжений (нормальных и касательных) 
            Параметры:
                Forces - Словарь со значениями сил и моментов по осям, силы в Н, моменты в Нм   
            Возвращает:
                Словарь со значениями экстремальных нормальных напряжений, МПа: {'+': максимальное значение при растяжении, 
                '-': максимальное значение при сжатии} и касательных напряжений, МПа
        '''
        if Forces is None:
            Forces = {}
        N_Matrix = self.getNormalTensionMatrix(Forces)
        T_Matrix = self.getTangetialTensionMatrix(Forces)
        return {gl.sigma('+'): float(N_Matrix.max()),
                gl.sigma('-'): float(N_Matrix.min()),
                gl.tau: float(T_Matrix.max())}

    def calculateTensions(self, Forces=None, theory=3):
        ''' 
        Получение главных напряжений
            Параметры:
                Forces - Словарь со значениями сил и моментов по осям, силы в Н, моменты в Нм
                theory - Теория расчета касательных напряжений (по умолчанию 3 - теория наибольших касательных напряжений)
                    так же имплементированы:
                    - первая (1) теория - теория наибольших нормальных напряжений
                    - четвертая (4) теория - энергетическая

            Возвращает: значение опасного напряжения, МПа
        '''
        if Forces is None:
            Forces = {}
        N_Matrix = np.abs(self.getNormalTensionMatrix(Forces))
        T_Matrix = self.getTangetialTensionMatrix(Forces)
        sigma_1 = N_Matrix / 2 + np.hypot(N_Matrix / 2, T_Matrix)
        sigma_3 = N_Matrix / 2 - np.hypot(N_Matrix / 2, T_Matrix)
        if theory == 1:
            return float(sigma_1.max())
        elif theory == 4:
            return float(np.sqrt(np.pow(sigma_1, 2) + np.pow(sigma_3, 2) - sigma_1 * sigma_3).max())
        else:
            return float((sigma_1 - sigma_3).max())

    def getArea(self):
        '''
        Вычисление площади сечения в расчетном пространстве
        '''
        return float(self.arr.sum() * math.pow(self.res, 2))

    def calculateParams(self):
        '''
        Расчет всех параметров сечения
        '''
        COM = self.centerOfMass
        SM = self.crossectionMoment
        IM = self.inertionMoment
        RM = self.resistanceMoment
        IR = self.inertionRadius
        return {'A': self.area} | COM | IM | RM | SM | IR | {'axis': self.axis}

    def plot(self):
        ''' 
        Графический вывод полученных результатов
        '''
        mpl_mod, plt_mod = _require_matplotlib()
        fig, ax = plt_mod.subplots()
        image = np.ma.masked_where(self.arr == 0, self.arr)
        cmap = mpl_mod.colormaps['gist_gray']
        cmap.set_bad(color='white')
        ax.imshow(image, cmap=cmap)
        y_ticks = ax.get_yticks()
        y_ticks = y_ticks[y_ticks >= 0]
        y_ticks = y_ticks[y_ticks < self.h]
        y_ticks = np.append(y_ticks, self.h)
        ax.set_yticks(y_ticks, labels=np.flip(
            [f'{round(x * self.res)}'for x in y_ticks]))
        x_ticks = ax.get_xticks()
        x_ticks = x_ticks[x_ticks >= 0]
        x_ticks = x_ticks[x_ticks < self.b]
        x_ticks = np.append(x_ticks, self.b)
        ax.set_xticks(x_ticks, labels=[
                      f'{round(x * self.res)}'for x in x_ticks])
        plt_mod.show()

    def plotNormalTension(self, Forces=None):
        ''' 
        Графический вывод нормальных напряжений
            Параметры:
                Forces - Словарь со значениями сил и моментов по осям, силы в Н, моменты в Нм
        '''
        if Forces is None:
            Forces = {}
        mpl_mod, plt_mod = _require_matplotlib()
        TMatrix = self.getNormalTensionMatrix(Forces)
        fig, ax = plt_mod.subplots()
        image = np.ma.masked_where(TMatrix == 0, TMatrix)
        cmap = mpl_mod.colormaps['hsv']
        cmap.set_bad(color='white')
        fig.colorbar(ax.imshow(image, cmap=cmap))
        y_ticks = ax.get_yticks()
        y_ticks = y_ticks[y_ticks >= 0]
        y_ticks = y_ticks[y_ticks < self.h]
        y_ticks = np.append(y_ticks, self.h)
        ax.set_yticks(y_ticks, labels=np.flip(
            [f'{round(x * self.res)}'for x in y_ticks]))
        x_ticks = ax.get_xticks()
        x_ticks = x_ticks[x_ticks >= 0]
        x_ticks = x_ticks[x_ticks < self.b]
        x_ticks = np.append(x_ticks, self.b)
        ax.set_xticks(x_ticks, labels=[
                      f'{round(x * self.res)}'for x in x_ticks])
        plt_mod.show()

    def plotTangetialTension(self, Forces=None):
        ''' 
        Графический вывод нормальных напряжений
            Параметры:
                Forces - Словарь со значениями сил и моментов по осям, силы в Н, моменты в Нм
                IM - Словарь со значениями инерционных моментов по осям
                COM - Словарь с координатами центра масс по осям
        '''
        if Forces is None:
            Forces = {}
        mpl_mod, plt_mod = _require_matplotlib()
        TMatrix = self.getTangetialTensionMatrix(Forces)
        fig, ax = plt_mod.subplots()
        image = np.ma.masked_where(TMatrix == 0, TMatrix)
        cmap = mpl_mod.colormaps['hsv']
        cmap.set_bad(color='white')
        fig.colorbar(ax.imshow(image, cmap=cmap))
        y_ticks = ax.get_yticks()
        y_ticks = y_ticks[y_ticks >= 0]
        y_ticks = y_ticks[y_ticks < self.h]
        y_ticks = np.append(y_ticks, self.h)
        ax.set_yticks(y_ticks, labels=np.flip(
            [f'{round(x * self.res)}'for x in y_ticks]))
        x_ticks = ax.get_xticks()
        x_ticks = x_ticks[x_ticks >= 0]
        x_ticks = x_ticks[x_ticks < self.b]
        x_ticks = np.append(x_ticks, self.b)
        ax.set_xticks(x_ticks, labels=[
                      f'{round(x * self.res)}'for x in x_ticks])
        plt_mod.show()

    def __str__(self):
        return f'Crossection: {self.name}'

    def __repr__(self):
        return f'<Crossection: {self.name}>'


class Sortament:
    _db = {
        # Уголки равнополочные
        'L20x3': {'h': 20, 't': 3, 'R': 3.5, 'r': 1.2},
        'L20x4': {'h': 20, 't': 4, 'R': 3.5, 'r': 1.2},
        'L25x3': {'h': 25, 't': 3, 'R': 3.5, 'r': 1.2},
        'L25x4': {'h': 25, 't': 4, 'R': 3.5, 'r': 1.2},
        'L28x3': {'h': 28, 't': 3, 'R': 4, 'r': 1.3},
        'L30x3': {'h': 30, 't': 3, 'R': 4, 'r': 1.3},
        'L30x4': {'h': 30, 't': 4, 'R': 4, 'r': 1.3},
        'L32x3': {'h': 32, 't': 3, 'R': 4.5, 'r': 1.5},
        'L32x4': {'h': 32, 't': 4, 'R': 4.5, 'r': 1.5},
        'L35x3': {'h': 35, 't': 3, 'R': 4.5, 'r': 1.5},
        'L35x4': {'h': 35, 't': 4, 'R': 4.5, 'r': 1.5},
        'L35x5': {'h': 35, 't': 5, 'R': 4.5, 'r': 1.5},
        'L40x3': {'h': 40, 't': 3, 'R': 5, 'r': 1.7},
        'L40x4': {'h': 40, 't': 4, 'R': 5, 'r': 1.7},
        'L40x5': {'h': 40, 't': 5, 'R': 5, 'r': 1.7},
        'L45x3': {'h': 45, 't': 3, 'R': 5, 'r': 1.7},
        'L45x4': {'h': 45, 't': 4, 'R': 5, 'r': 1.7},
        'L45x5': {'h': 45, 't': 5, 'R': 5, 'r': 1.7},
        'L50x3': {'h': 50, 't': 3, 'R': 5.5, 'r': 1.8},
        'L50x4': {'h': 50, 't': 4, 'R': 5.5, 'r': 1.8},
        'L50x5': {'h': 50, 't': 5, 'R': 5.5, 'r': 1.8},
        'L50x6': {'h': 50, 't': 6, 'R': 5.5, 'r': 1.8},
        'L56x4': {'h': 56, 't': 4, 'R': 6, 'r': 2},
        'L56x5': {'h': 56, 't': 5, 'R': 6, 'r': 2},
        'L63x4': {'h': 63, 't': 4, 'R': 7, 'r': 2.3},
        'L63x5': {'h': 63, 't': 5, 'R': 7, 'r': 2.3},
        'L63x6': {'h': 63, 't': 6, 'R': 7, 'r': 2.3},
        'L70x4.5': {'h': 70, 't': 4.5, 'R': 8, 'r': 2.7},
        'L70x5': {'h': 70, 't': 5, 'R': 8, 'r': 2.7},
        'L70x6': {'h': 70, 't': 6, 'R': 8, 'r': 2.7},
        'L70x7': {'h': 70, 't': 7, 'R': 8, 'r': 2.7},
        'L70x8': {'h': 70, 't': 8, 'R': 8, 'r': 2.7},
        'L75x5': {'h': 75, 't': 5, 'R': 9, 'r': 3},
        'L75x6': {'h': 75, 't': 6, 'R': 9, 'r': 3},
        'L75x7': {'h': 75, 't': 7, 'R': 9, 'r': 3},
        'L75x8': {'h': 75, 't': 8, 'R': 9, 'r': 3},
        'L75x9': {'h': 75, 't': 9, 'R': 9, 'r': 3},
        'L80x5.5': {'h': 80, 't': 5.5, 'R': 9, 'r': 3},
        'L80x6': {'h': 80, 't': 6, 'R': 9, 'r': 3},
        'L80x7': {'h': 80, 't': 7, 'R': 9, 'r': 3},
        'L80x8': {'h': 80, 't': 8, 'R': 9, 'r': 3},
        'L90x6': {'h': 90, 't': 6, 'R': 10, 'r': 3.3},
        'L90x7': {'h': 90, 't': 7, 'R': 10, 'r': 3.3},
        'L90x8': {'h': 90, 't': 8, 'R': 10, 'r': 3.3},
        'L90x9': {'h': 90, 't': 9, 'R': 10, 'r': 3.3},
        'L100x6.5': {'h': 100, 't': 6.5, 'R': 12, 'r': 4},
        'L100x7': {'h': 100, 't': 7, 'R': 12, 'r': 4},
        'L100x8': {'h': 100, 't': 8, 'R': 12, 'r': 4},
        'L100x9': {'h': 100, 't': 9, 'R': 12, 'r': 4},
        'L100x10': {'h': 100, 't': 10, 'R': 12, 'r': 4},
        'L100x12': {'h': 100, 't': 12, 'R': 12, 'r': 4},
        'L100x14': {'h': 100, 't': 14, 'R': 12, 'r': 4},
        'L100x16': {'h': 100, 't': 16, 'R': 12, 'r': 4},
        'L110x7': {'h': 110, 't': 7, 'R': 12, 'r': 4},
        'L110x8': {'h': 110, 't': 8, 'R': 12, 'r': 4},
        'L125x8': {'h': 125, 't': 8, 'R': 14, 'r': 4.6},
        'L125x9': {'h': 125, 't': 9, 'R': 14, 'r': 4.6},
        'L125x10': {'h': 125, 't': 10, 'R': 14, 'r': 4.6},
        'L125x12': {'h': 125, 't': 12, 'R': 14, 'r': 4.6},
        'L125x14': {'h': 125, 't': 14, 'R': 14, 'r': 4.6},
        'L125x16': {'h': 125, 't': 16, 'R': 14, 'r': 4.6},
        'L140x9': {'h': 140, 't': 9, 'R': 14, 'r': 4.6},
        'L140x10': {'h': 140, 't': 10, 'R': 14, 'r': 4.6},
        'L140x12': {'h': 140, 't': 12, 'R': 14, 'r': 4.6},
        'L160x10': {'h': 160, 't': 10, 'R': 16, 'r': 5.3},
        'L160x11': {'h': 160, 't': 11, 'R': 16, 'r': 5.3},
        'L160x12': {'h': 160, 't': 12, 'R': 16, 'r': 5.3},
        'L160x14': {'h': 160, 't': 14, 'R': 16, 'r': 5.3},
        'L160x16': {'h': 160, 't': 16, 'R': 16, 'r': 5.3},
        'L160x18': {'h': 160, 't': 18, 'R': 16, 'r': 5.3},
        'L160x20': {'h': 160, 't': 20, 'R': 16, 'r': 5.3},
        'L180x11': {'h': 180, 't': 11, 'R': 16, 'r': 5.3},
        'L180x12': {'h': 180, 't': 12, 'R': 16, 'r': 5.3},
        'L200x12': {'h': 200, 't': 12, 'R': 18, 'r': 6},
        'L200x13': {'h': 200, 't': 13, 'R': 18, 'r': 6},
        'L200x14': {'h': 200, 't': 14, 'R': 18, 'r': 6},
        'L200x16': {'h': 200, 't': 16, 'R': 18, 'r': 6},
        'L200x20': {'h': 200, 't': 20, 'R': 18, 'r': 6},
        'L200x25': {'h': 200, 't': 25, 'R': 18, 'r': 6},
        'L200x30': {'h': 200, 't': 30, 'R': 18, 'r': 6},
        'L220x14': {'h': 220, 't': 14, 'R': 21, 'r': 7},
        'L220x16': {'h': 220, 't': 16, 'R': 21, 'r': 7},
        'L250x16': {'h': 250, 't': 16, 'R': 24, 'r': 8},
        'L250x18': {'h': 250, 't': 18, 'R': 24, 'r': 8},
        'L250x20': {'h': 250, 't': 20, 'R': 24, 'r': 8},
        'L250x22': {'h': 250, 't': 22, 'R': 24, 'r': 8},
        'L250x25': {'h': 250, 't': 25, 'R': 24, 'r': 8},
        'L250x28': {'h': 250, 't': 28, 'R': 24, 'r': 8},
        'L250x30': {'h': 250, 't': 30, 'R': 24, 'r': 8},
        'L250x35': {'h': 250, 't': 35, 'R': 24, 'r': 8},
    }

    @staticmethod
    def getSortamentList():
        '''
        Получение списка сортамента
        '''
        return list(Sortament._db.keys())

    @staticmethod
    def getSortament(name, cacheProps=True):
        '''
        Получение модели сортамента
            Параметры:
                name: Наименование сортамента
                cacheProps: Флаг кэширования
        '''
        sort = Sortament._db.get(name, None)
        if sort is None:
            raise ValueError(f'Сортамент {name} не найден')
        cs = Crossection(name=name, cacheProps=cacheProps)
        liter = name[0]
        if liter == 'L':
            cs.LShape(**sort)
        else:
            # TODO: Обращение у базе данных
            raise ValueError(f'Неизвестный сортамент: {name}')
        return cs


class Material:
    def __init__(self, **kwargs):
        self.name = kwargs.get('name', '')
        self.Rt = kwargs.get('Rt', None) or 235
        self.Rb = kwargs.get('Rb', None) or 360
        self.E = kwargs.get('E', None) or 2.06e5
        self.G = kwargs.get('G', None) or 0.79e5
        self.alpha = kwargs.get(gl.alpha(), None) or 0.12e-4
        self.rho = kwargs.get(gl.rho(), None) or 7850

    def dict(self):
        return {
            'name': self.name,
            'Rt': self.Rt,
            'Rb': self.Rb,
            'E': self.E,
            'G': self.G,
            gl.alpha(): self.alpha,
            gl.rho(): self.rho
        }

    def __str__(self):
        return f'Material: {self.name}'

    def __repr__(self):
        return f'<Material: {self.name}>'


class Steel:
    '''
    Rt - предел текучести, МПа
    Rb - временное сопротивление, МПа
    '''
    _db = {
        '15': {'Rt': 225, 'Rb': 370},
        '20': {'Rt': 245, 'Rb': 410},
        '25': {'Rt': 275, 'Rb': 450},
        '30': {'Rt': 295, 'Rb': 490},
        '35': {'Rt': 315, 'Rb': 530},
        '40': {'Rt': 335, 'Rb': 570},
        '45': {'Rt': 355, 'Rb': 600},
        '50': {'Rt': 375, 'Rb': 630},
        '55': {'Rt': 380, 'Rb': 650},
        '60': {'Rt': 400, 'Rb': 680},
        '15Г': {'Rt': 245, 'Rb': 410},
        '20Г': {'Rt': 275, 'Rb': 450},
        '25Г': {'Rt': 295, 'Rb': 490},
        '30Г': {'Rt': 315, 'Rb': 540},
        '35Г': {'Rt': 335, 'Rb': 560},
        '40Г': {'Rt': 355, 'Rb': 590},
        '45Г': {'Rt': 375, 'Rb': 620},
        '50Г': {'Rt': 390, 'Rb': 650},
        'Ст2': {'Rt': 195, 'Rb': 335},
        'Ст3': {'Rt': 205, 'Rb': 370},
        'Ст4': {'Rt': 235, 'Rb': 410},
        'Ст5': {'Rt': 255, 'Rb': 490},
        'Ст6': {'Rt': 295, 'Rb': 590},
        'C235': {'Rt': 235, 'Rb': 360},
        'C245': {'Rt': 245, 'Rb': 370},
        'C255': {'Rt': 255, 'Rb': 380},
        'C345': {'Rt': 345, 'Rb': 490},
        'C355': {'Rt': 355, 'Rb': 470},
        'C390': {'Rt': 390, 'Rb': 520},
        'C440': {'Rt': 440, 'Rb': 540},
        'C550': {'Rt': 540, 'Rb': 640},
        'C590': {'Rt': 590, 'Rb': 685},
        'C690': {'Rt': 690, 'Rb': 785},
        'ВСт3сп': {'Rt': 245, 'Rb': 372},
        'ВСт3пс': {'Rt': 245, 'Rb': 370},
        'ВСт3кп': {'Rt': 235, 'Rb': 360},
        'ВСт3Гпс': {'Rt': 245, 'Rb': 370},
        '09Г2С': {'Rt': 345, 'Rb': 490},
        '10Г2С1 ': {'Rt': 355, 'Rb': 460},
        '16Г2АФ': {'Rt': 410, 'Rb': 570},
    }

    @staticmethod
    def getSteeltList():
        '''
        Получение списка сталей
        '''
        return list(Steel._db.keys())

    @staticmethod
    def getSteel(name):
        '''
        Получение стали
        '''
        sort = Steel._db.get(name, None)
        if sort is None:
            # TODO: Обращение у базе данных
            raise ValueError(f'Наименование {name} не найдено')
        else:
            kwargs = sort | {'name': name, 'E': 2.06e5,
                             'G': 0.79e5, gl.alpha(): 0.12e-4, gl.rho(): 7850}
            return Material(**kwargs)
